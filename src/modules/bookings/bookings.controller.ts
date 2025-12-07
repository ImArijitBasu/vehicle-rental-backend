import { Request, Response } from "express";
import { bookingServices } from "./bookings.service";


const createBooking = async (req: Request, res: Response) => {
  try {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } =req.body;

    if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (customer_id, vehicle_id, rent_start_date, rent_end_date) are required",
      });
    }


    const user = req.user;
    if (user?.role === "customer" && user.id !== customer_id) {
      return res.status(403).json({
        success: false,
        message: "You can only create bookings for yourself",
      });
    }

    const result = await bookingServices.createBooking(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getAllBookings = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await bookingServices.getAllBookings(user.id, user.role);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getBookingById = async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId as string);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await bookingServices.getBookingById(
      bookingId,
      user.id,
      user.role
    );

    if (!result.success) {
      const statusCode = result.message === "Booking not found" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:error.message,
    });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId as string);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await bookingServices.updateBooking(
      bookingId,
      req.body,
      user.id,
      user.role
    );

    if (!result.success) {
      const statusCode = result.message === "Booking not found" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const bookingControllers = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
};
