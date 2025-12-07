import { Request, Response } from "express";
import { userServices } from "./user.service";

const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, password, phone) are required",
      });
    }

    const result = await userServices.createUser(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};



const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getAllUsers();

    if (!result.success) {
      return res.status(500).json(result);
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

const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const result = await userServices.getUserById(userId);

    if (!result.success) {
      return res
        .status(result.message === "User not found" ? 404 : 400)
        .json(result);
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

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const currentUser = req.user;

    if (currentUser?.role === "customer" && req.body.role) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your role",
      });
    }

    if (currentUser?.role === "customer" && currentUser.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    const result = await userServices.updateUser(userId, req.body);

    if (!result.success) {
      const statusCode = result.message === "User not found" ? 404 : 400;
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

const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const currentUser = req.user;
    if (currentUser?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete users",
      });
    }

    if (currentUser.id === userId) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete their own account",
      });
    }

    const result = await userServices.deleteUser(userId);

    if (!result.success) {
      const statusCode = result.message === "User not found" ? 404 : 400;
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

export const userControllers = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};