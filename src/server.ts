import express, { Request, Response } from "express"
import initDB from "./config/db";
import config from "./config";
import { userRoutes } from "./modules/users/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { vehicleRoutes } from "./modules/vehicles/vehicles.route";

const app = express()
app.use(express.json());

initDB();

//! routes for users
app.use("/api/v1" ,userRoutes )
//! login route
app.use("/api/v1", authRoutes)
//! vehicle routes
app.use("/api/v1" , vehicleRoutes)
app.get("/", (req: Request, res: Response) => {
    res.send("vehicle rental server")
})
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path
    })
})

app.listen(config.port, () => {
    console.log("Server is running on: " ,config.port);
})