import { Router } from "express";
import { authControllers } from "./auth.controller";


const router = Router();

router.post("/auth/signin", authControllers.loginUser);

export const authRoutes = router;
