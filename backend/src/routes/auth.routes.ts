import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { loginSchema } from "../validation/auth.schema.js";
import { postLogin, getMe } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", validate({ body: loginSchema }), asyncHandler(postLogin));
router.get("/me", authenticate, asyncHandler(getMe));

export default router;
