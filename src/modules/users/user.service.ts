import bcrypt from "bcryptjs";
import { pool } from "../../config/db";

const createUser = async (payload: Record<string, any>) => {
  const { name, email, password, phone ,role } = payload;

  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters",
    };
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `,
    [name, email.toLowerCase(), hashedPass, phone ,role]
    );
    delete result.rows[0].password
    delete result.rows[0].created_at
    delete result.rows[0].updated_at
  return {
    success: true,
    message: "User created successfully",
    data: result.rows[0],
  };
};

const getAllUser = async () => {
  const result = await pool.query(`SELECT * FROM users`);
  const users = result.rows.map((user) => {
    const { password, created_at, updated_at, ...rest } = user;
    return rest;
  });
    return users;
};
export const userServices = {
    createUser,
    getAllUser
};
