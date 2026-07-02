import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getHealth } from "../controllers/system.controller.js";
import authRoutes from "./auth.routes.js";
import healthDataRoutes from "./healthData.routes.js";
import patientRoutes from "./patient.routes.js";
import geneticsRoutes from "./genetics.routes.js";
import profileRoutes from "./profile.routes.js";

const router = Router();

router.get("/health", asyncHandler(getHealth));
router.use("/auth", authRoutes);
router.use("/health-data", healthDataRoutes);
router.use("/patients", patientRoutes);
router.use("/genetics", geneticsRoutes);
router.use("/patient-profile", profileRoutes);

export default router;
