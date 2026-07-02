import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { patientIdParamSchema } from "../validation/common.schema.js";
import { getProfile } from "../controllers/profile.controller.js";

const router = Router();

router.get("/:id", authenticate, validate({ params: patientIdParamSchema }), asyncHandler(getProfile));

export default router;
