import { Router } from 'express';
import { userControllers } from './user.controller';
import authorize from '../../middleware/auth';
const router = Router();

router.post("/auth/signup", userControllers.createUser)

router.get("/users", authorize("admin"), userControllers.getAllUsers);
router.get("/users/:userId",authorize("admin", "customer"),userControllers.getUserById);
router.put("/users/:userId",authorize("admin", "customer"),userControllers.updateUser);
router.delete("/users/:userId", authorize("admin"), userControllers.deleteUser);
export const userRoutes = router