
import { Router } from "express";
import upload from "../middleware/upload";
import { uploadPhoto } from "../controllers/photoController";

const router = Router();

router.post("/", upload.single("photo"), (req, res, next) => {
  next();
}, uploadPhoto);

export default router;
