import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { deviceAuth } from "../middleware/deviceAuth.js";
import { healthDataPayloadSchema } from "../validation/healthData.schema.js";
import { postHealthData } from "../controllers/ingestion.controller.js";

const router = Router();

router.post("/", deviceAuth, validate({ body: healthDataPayloadSchema }), asyncHandler(postHealthData));

export default router;
