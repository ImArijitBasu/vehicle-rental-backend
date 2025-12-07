
import bcrypt from "bcryptjs";
import { pool } from "../../config/db";

const createUser = async (payload: Record<string, any>) => {
  const { name, email, password, phone, role } = payload;

  // Validation
  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters",
    };
  }

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Valid email is required",
    };
  }

  if (!phone || phone.length < 10) {
    return {
      success: false,
      message: "Valid phone number is required",
    };
  }

  // checking if user is already there
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    return {
      success: false,
      message: "Email already registered",
    };
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const validRole =
    role && ["admin", "customer"].includes(role) ? role : "customer";

  try {
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone, role;
      `,
      [name, email.toLowerCase(), hashedPass, phone, validRole]
    );

    return {
      success: true,
      message: "User created successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    return {
      success: false,
      message: error.message,
    };
  }
};


const getAllUsers = async () => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role FROM users ORDER BY id`
    );
    return {
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const getUserById = async (userId: number) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User retrieved successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const updateUser = async (userId: number, payload: Record<string, any>) => {
  const { name, email, phone, role } = payload;

  try {
    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);

    if (userExists.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email.toLowerCase(), userId]
      );

      if (emailCheck.rows.length > 0) {
        return {
          success: false,
          message: "Email already in use",
        };
      }
    }

    if (role && !["admin", "customer"].includes(role)) {
      return {
        success: false,
        message: "Role must be either 'admin' or 'customer'",
      };
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email.toLowerCase());
      paramCount++;
    }

    if (phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (role) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return {
        success: false,
        message: "No update data provided",
      };
    }

    values.push(userId);

    const queryStr = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} 
      RETURNING id, name, email, phone, role
    `;

    const result = await pool.query(queryStr, values);

    return {
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    };
  } catch (error: any) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    return {
      success: false,
      message: error.message,
    };
  }
};

const deleteUser = async (userId: number) => {
  try {
    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);

    if (userExists.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    
    const activeBookings = await pool.query(
      "SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'",
      [userId]
    );

    if (activeBookings.rows.length > 0) {
      return {
        success: false,
        message: "Cannot delete user with active bookings",
      };
    }
    

    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const userServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};