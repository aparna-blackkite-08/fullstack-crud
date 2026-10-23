import { protect, type AuthRequest } from "../middleware/authMiddleware";
import { Router } from "express";
import { login, register, getProfile, updateProfile } from "../controllers/authController";
import type { User } from "../models/User";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;

