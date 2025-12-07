import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, any>) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status = "available",
  } = payload;

  // Validation
  if (!vehicle_name || !type || !registration_number || !daily_rent_price) {
    return {
      success: false,
      message: "All fields are required",
    };
  }

  // Validate type
  const validTypes = ["car", "bike", "van", "SUV"];
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: "Type must be one of: car, bike, van, SUV",
    };
  }

  // Validate availability_status
  const validStatuses = ["available", "booked"];
  if (availability_status && !validStatuses.includes(availability_status)) {
    return {
      success: false,
      message: "Availability status must be 'available' or 'booked'",
    };
  }

  // Check if registration number already exists
  const existingVehicle = await pool.query(
    "SELECT id FROM vehicles WHERE registration_number = $1",
    [registration_number]
  );

  if (existingVehicle.rows.length > 0) {
    return {
      success: false,
      message: "Registration number already exists",
    };
  }

  try {
    // Create vehicle
    const result = await pool.query(
      `
      INSERT INTO vehicles 
      (vehicle_name, type, registration_number, daily_rent_price, availability_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        vehicle_name,
        type,
        registration_number,
        daily_rent_price,
        availability_status,
      ]
    );

    return {
      success: true,
      message: "Vehicle created successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const getAllVehicles = async () => {
  try {
    const result = await pool.query(`SELECT * FROM vehicles ORDER BY id`);

    return {
      success: true,
      message: "Vehicles retrieved successfully",
      data: result.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const getVehicleById = async (vehicleId: number) => {
  try {
    const result = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [
      vehicleId,
    ]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Vehicle not found",
      };
    }

    return {
      success: true,
      message: "Vehicle retrieved successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const updateVehicle = async (
  vehicleId: number,
  payload: Record<string, any>
) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  try {
    // Check if vehicle exists
    const vehicleExists = await pool.query(
      "SELECT id FROM vehicles WHERE id = $1",
      [vehicleId]
    );

    if (vehicleExists.rows.length === 0) {
      return {
        success: false,
        message: "Vehicle not found",
      };
    }

    // Validate type if provided
    if (type) {
      const validTypes = ["car", "bike", "van", "SUV"];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          message: "Type must be one of: car, bike, van, SUV",
        };
      }
    }

    // Validate availability_status if provided
    if (availability_status) {
      const validStatuses = ["available", "booked"];
      if (!validStatuses.includes(availability_status)) {
        return {
          success: false,
          message: "Availability status must be 'available' or 'booked'",
        };
      }
    }

    // If registration number is being changed, check if new one already exists
    if (registration_number) {
      const registrationCheck = await pool.query(
        "SELECT id FROM vehicles WHERE registration_number = $1 AND id != $2",
        [registration_number, vehicleId]
      );

      if (registrationCheck.rows.length > 0) {
        return {
          success: false,
          message: "Registration number already in use",
        };
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (vehicle_name) {
      updates.push(`vehicle_name = $${paramCount}`);
      values.push(vehicle_name);
      paramCount++;
    }

    if (type) {
      updates.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }

    if (registration_number) {
      updates.push(`registration_number = $${paramCount}`);
      values.push(registration_number);
      paramCount++;
    }

    if (daily_rent_price) {
      updates.push(`daily_rent_price = $${paramCount}`);
      values.push(daily_rent_price);
      paramCount++;
    }

    if (availability_status) {
      updates.push(`availability_status = $${paramCount}`);
      values.push(availability_status);
      paramCount++;
    }

    if (updates.length === 0) {
      return {
        success: false,
        message: "No update data provided",
      };
    }

    values.push(vehicleId);

    const queryStr = `
      UPDATE vehicles 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(queryStr, values);

    return {
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint violation
      return {
        success: false,
        message: "Registration number already exists",
      };
    }

    return {
      success: false,
      message: error.message,
    };
  }
};

const deleteVehicle = async (vehicleId: number) => {
  try {
    // Check if vehicle exists
    const vehicleExists = await pool.query(
      "SELECT id FROM vehicles WHERE id = $1",
      [vehicleId]
    );

    if (vehicleExists.rows.length === 0) {
      return {
        success: false,
        message: "Vehicle not found",
      };
    }

    // Check if vehicle has active bookings
    const activeBookings = await pool.query(
      "SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'",
      [vehicleId]
    );

    if (activeBookings.rows.length > 0) {
      return {
        success: false,
        message: "Cannot delete vehicle with active bookings",
      };
    }

    // Delete vehicle
    await pool.query("DELETE FROM vehicles WHERE id = $1", [vehicleId]);

    return {
      success: true,
      message: "Vehicle deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const vehicleServices = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
