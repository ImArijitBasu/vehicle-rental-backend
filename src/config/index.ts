import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  database_url: process.env.DATABASE_URL,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET,
  expires: process.env.JWT_EXPIRES_IN
};

export default config;
