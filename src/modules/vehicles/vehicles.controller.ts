import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.service";


const createVehicle = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    } = req.body;

    // Basic validation
    if (!vehicle_name || !type || !registration_number || !daily_rent_price) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }

    const result = await vehicleServices.createVehicle(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message ,
    });
  }
};

const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getAllVehicles();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message ,
    });
  }
};

const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = await vehicleServices.getVehicleById(vehicleId);

    if (!result.success) {
      return res
        .status(result.message === "Vehicle not found" ? 404 : 400)
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

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = await vehicleServices.updateVehicle(vehicleId, req.body);

    if (!result.success) {
      const statusCode = result.message === "Vehicle not found" ? 404 : 400;
      return res.status(statusCode).json(result);
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

const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = await vehicleServices.deleteVehicle(vehicleId);

    if (!result.success) {
      const statusCode = result.message === "Vehicle not found" ? 404 : 400;
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

export const vehicleControllers = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
