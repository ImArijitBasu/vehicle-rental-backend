import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import config from "../config";
import { pool } from "../config/db";


const authorize = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "unauthorized",
        });
      }

      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const decoded = jwt.verify(
        token!,
        config.jwt_secret as string
      ) as JwtPayload;
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized request!!",
        });
      }

      // ADMIN
      if (decoded.role === "admin") {
        return next();
      }

      // CUSTOMER
      if (decoded.role === "customer") {
        const isAuthorized = await checkCustomerOwnership(req, decoded);

        if (isAuthorized) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: "You can only access your own data",
        });
      }

      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: error.message,
      });
    }
  };
};

const checkCustomerOwnership = async (
  req: Request,
  user: JwtPayload
): Promise<boolean> => {
  const { userId, bookingId, id } = req.params;

  if (userId || id) {
    const targetUserId = parseInt(userId as string);
    return user.id === targetUserId;
  }

  // Check booking ownership 
  if (bookingId) {
    const booking = await pool.query(
      "SELECT customer_id FROM bookings WHERE id = $1",
      [parseInt(bookingId)]
    );

    if (booking.rows.length === 0) return false;
    return user.id === booking.rows[0].customer_id;
  }

  if (req.method === "GET" && req.originalUrl.includes("/bookings")) {
    return true; 
  }

  if (req.method === "POST") {
 
    if (req.originalUrl.includes("/bookings")) {
      return req.body.customer_id === user.id;
    }
    return true;
  }


  if (req.originalUrl.includes("/vehicles") && req.method === "GET") {
    return true;
  }
  return false;
};


export const canUpdateBooking = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { bookingId } = req.params;
      const { status } = req.body;

      const bookingResult = await pool.query(
        "SELECT * FROM bookings WHERE id = $1",
        [parseInt(bookingId as string)]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = bookingResult.rows[0];


      if (req.user.role === "admin") {
        req.booking = booking; 
        return next();
      }

      if (req.user.role === "customer") {
        if (booking.customer_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "You can only update your own bookings",
          });
        }

        if (status === "returned") {
          return res.status(403).json({
            success: false,
            message: "Only admin can mark booking as returned",
          });
        }

        if (status === "cancelled") {
          const now = new Date();
          const startDate = new Date(booking.rent_start_date);

          if (now >= startDate) {
            return res.status(400).json({
              success: false,
              message: "Cannot cancel booking after start date",
            });
          }
        }

        req.booking = booking;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
};



export default authorize;
