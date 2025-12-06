import { Router } from 'express';
import { userControllers } from './user.controller';
const router = Router();

router.post("/auth/signup", userControllers.createUser)

router.get("/users" , userControllers.getAllUser);
// router.get("/users/:id")
// router.put("/users/:userId")
// router.delete("/users/:userId")
export const userRoutes = router