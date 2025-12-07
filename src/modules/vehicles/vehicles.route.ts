import { Router } from "express";

import authorize from "../../middleware/auth";
import { vehicleControllers } from "./vehicles.controller";

const router = Router();


router.get("/vehicles", vehicleControllers.getAllVehicles);

router.get("/vehicles/:vehicleId", vehicleControllers.getVehicleById);

router.post("/vehicles", authorize("admin"), vehicleControllers.createVehicle);

router.put("/vehicles/:vehicleId",authorize("admin"),vehicleControllers.updateVehicle);

router.delete("/vehicles/:vehicleId",authorize("admin"),vehicleControllers.deleteVehicle);

export const vehicleRoutes = router;
