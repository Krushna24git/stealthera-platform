import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { geneticsParamSchema } from "../validation/common.schema.js";
import { getGenetics } from "../controllers/genetics.controller.js";

const router = Router();

router.get("/:patientId", validate({ params: geneticsParamSchema }), asyncHandler(getGenetics));

export default router;
