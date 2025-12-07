import { pool } from "../../config/db";

const createBooking = async (payload: Record<string, any>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    return {
      success: false,
      message:
        "customer_id, vehicle_id, rent_start_date, and rent_end_date are required",
    };
  }

  const startDate = new Date(rent_start_date);
  const endDate = new Date(rent_end_date);

  if (endDate <= startDate) {
    return { success: false, message: "End date must be after start date" };
  }

  try {
    const customerCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [customer_id]
    );
    if (customerCheck.rows.length === 0) {
      return { success: false, message: "Customer not found" };
    }
    const vehicleResult = await pool.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [vehicle_id]
    );
    if (vehicleResult.rows.length === 0) {
      return { success: false, message: "Vehicle not found" };
    }

    const vehicle = vehicleResult.rows[0];
    if (vehicle.availability_status !== "available") {
      return { success: false, message: "Vehicle is not available" };
    }




    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
    );
    const totalPrice = vehicle.daily_rent_price * days;

    await pool.query("BEGIN");

    try {
      // Create
      const bookingResult = await pool.query(
        `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
         VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
        [customer_id, vehicle_id, rent_start_date, rent_end_date, totalPrice]
      );

      // Update status
      await pool.query(
        "UPDATE vehicles SET availability_status = 'booked' WHERE id = $1",
        [vehicle_id]
      );

      await pool.query("COMMIT");

      return {
        success: true,
        message: "Booking created successfully",
        data: {
          ...bookingResult.rows[0],
          vehicle: {
            vehicle_name: vehicle.vehicle_name,
            daily_rent_price: vehicle.daily_rent_price,
          },
        },
      };
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

const getAllBookings = async (userId?: number, userRole?: string) => {
  try {
    // return expired booking
    await pool.query(`
      UPDATE bookings 
      SET status = 'returned'
      WHERE status = 'active' 
      AND rent_end_date < CURRENT_DATE
    `);

    let query = "";
    const params: any[] = [];

    if (userRole === "admin") {
      query = `
        SELECT 
          b.id,
          b.customer_id,
          b.vehicle_id,
          b.rent_start_date,
          b.rent_end_date,
          b.total_price,
          b.status,
          u.name as customer_name,
          u.email as customer_email,
          v.vehicle_name,
          v.registration_number
        FROM bookings b
        JOIN users u ON b.customer_id = u.id
        JOIN vehicles v ON b.vehicle_id = v.id
        ORDER BY b.id DESC
      `;
    } else {
      query = `
        SELECT 
          b.id,
          b.vehicle_id,
          b.rent_start_date,
          b.rent_end_date,
          b.total_price,
          b.status,
          v.vehicle_name,
          v.registration_number,
          v.type
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.customer_id = $1
        ORDER BY b.id DESC
      `;
      params.push(userId);
    }

    const result = await pool.query(query, params);

    const formattedData = result.rows.map((row) => {
      if (userRole === "admin") {
        return {
          id: row.id,
          customer_id: row.customer_id,
          vehicle_id: row.vehicle_id,
          rent_start_date: row.rent_start_date,
          rent_end_date: row.rent_end_date,
          total_price: row.total_price,
          status: row.status,
          customer: {
            name: row.customer_name,
            email: row.customer_email,
          },
          vehicle: {
            vehicle_name: row.vehicle_name,
            registration_number: row.registration_number,
          },
        };
      } else {
        return {
          id: row.id,
          vehicle_id: row.vehicle_id,
          rent_start_date: row.rent_start_date,
          rent_end_date: row.rent_end_date,
          total_price: row.total_price,
          status: row.status,
          vehicle: {
            vehicle_name: row.vehicle_name,
            registration_number: row.registration_number,
            type: row.type,
          },
        };
      }
    });

    return {
      success: true,
      message:
        userRole === "admin"
          ? "Bookings retrieved successfully"
          : "Your bookings retrieved successfully",
      data: formattedData,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

const getBookingById = async (
  bookingId: number,
  userId?: number,
  userRole?: string
) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
              json_build_object('name', u.name, 'email', u.email) as customer,
              json_build_object('vehicle_name', v.vehicle_name, 'registration_number', v.registration_number) as vehicle
       FROM bookings b
       JOIN users u ON b.customer_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return { success: false, message: "Booking not found" };
    }

    const booking = result.rows[0];

    if (userRole === "customer" && booking.customer_id !== userId) {
      return { success: false, message: "Access denied to this booking" };
    }

    return {
      success: true,
      message: "Booking retrieved",
      data: booking,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

const updateBooking = async (
  bookingId: number,
  payload: Record<string, any>,
  userId?: number,
  userRole?: string
) => {
  const { status } = payload;

  if (!status || !["cancelled", "returned"].includes(status)) {
    return {
      success: false,
      message: "Status must be 'cancelled' or 'returned'",
    };
  }

  try {
    const bookingResult = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return { success: false, message: "Booking not found" };
    }

    const booking = bookingResult.rows[0];

    if (userRole === "customer") {
      if (booking.customer_id !== userId) {
        return {
          success: false,
          message: "You can only update your own bookings",
        };
      }

      // admin -> returned
      if (status === "returned") {
        return {
          success: false,
          message: "Only admin can mark booking as returned",
        };
      }

      // Customer -> cancelled
      if (status === "cancelled") {
        const now = new Date();
        const startDate = new Date(booking.rent_start_date);

        if (now >= startDate) {
          return {
            success: false,
            message: "Cannot cancel booking after start date",
          };
        }
      }
    }

    await pool.query("BEGIN");

    try {
      const updateResult = await pool.query(
        "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
        [status, bookingId]
      );

      const updatedBooking = updateResult.rows[0];

      if (status === "cancelled" || status === "returned") {
        await pool.query(
          "UPDATE vehicles SET availability_status = 'available' WHERE id = $1",
          [booking.vehicle_id]
        );
      }

      await pool.query("COMMIT");

      if (status === "cancelled") {
        return {
          success: true,
          message: "Booking cancelled successfully",
          data: {
            id: updatedBooking.id,
            customer_id: updatedBooking.customer_id,
            vehicle_id: updatedBooking.vehicle_id,
            rent_start_date: updatedBooking.rent_start_date,
            rent_end_date: updatedBooking.rent_end_date,
            total_price: updatedBooking.total_price,
            status: updatedBooking.status,
          },
        };
      } else {
        const vehicleResult = await pool.query(
          "SELECT availability_status FROM vehicles WHERE id = $1",
          [booking.vehicle_id]
        );

        return {
          success: true,
          message: "Booking marked as returned. Vehicle is now available",
          data: {
            id: updatedBooking.id,
            customer_id: updatedBooking.customer_id,
            vehicle_id: updatedBooking.vehicle_id,
            rent_start_date: updatedBooking.rent_start_date,
            rent_end_date: updatedBooking.rent_end_date,
            total_price: updatedBooking.total_price,
            status: updatedBooking.status,
            vehicle: {
              availability_status: vehicleResult.rows[0].availability_status,
            },
          },
        };
      }
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const bookingServices = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
};
