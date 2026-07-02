import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { patientIdParamSchema } from "../validation/common.schema.js";
import {
  getPatients,
  getLatest,
  getPatientHistory,
  getPatientAlerts,
  getPatientSummary,
} from "../controllers/patient.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(getPatients));
router.get("/:id/latest", validate({ params: patientIdParamSchema }), asyncHandler(getLatest));
router.get("/:id/history", validate({ params: patientIdParamSchema }), asyncHandler(getPatientHistory));
router.get("/:id/alerts", validate({ params: patientIdParamSchema }), asyncHandler(getPatientAlerts));
router.get("/:id/summary", validate({ params: patientIdParamSchema }), asyncHandler(getPatientSummary));

export default router;
