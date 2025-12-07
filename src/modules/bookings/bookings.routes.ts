import { Router } from "express";
import authorize from "../../middleware/auth";
import { bookingControllers } from "./bookings.controller";

const router = Router();


router.post(
  "/bookings",
  authorize("admin", "customer"),
  bookingControllers.createBooking
);

router.get(
  "/bookings",
  authorize("admin", "customer"),
  bookingControllers.getAllBookings
);

router.get(
  "/bookings/:bookingId",
  authorize("admin", "customer"),
  bookingControllers.getBookingById
);

router.put(
  "/bookings/:bookingId",
  authorize("admin", "customer"),
  bookingControllers.updateBooking
);

export const bookingRoutes = router;
