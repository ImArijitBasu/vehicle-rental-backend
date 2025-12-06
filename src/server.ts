import express, { Request, Response } from "express"
import initDB from "./config/db";
import config from "./config";
import { userRoutes } from "./modules/users/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";

const app = express()
app.use(express.json());

initDB();

//! routes for users
app.use("/api/v1" ,userRoutes )
//! login route
app.use("/api/v1", authRoutes)


app.get("/", (req: Request, res: Response) => {
    res.send("hello guys")
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