
import { Router } from "express";
import upload from "../middleware/upload";
import { uploadPhoto,getAllPhotos,deletePhoto,togglePhotoLike,addPhotoComment } from "../controllers/photoController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
// Get all photos
router.get("/", getAllPhotos);

// Upload a photo
router.post("/", upload.single("photo"), (req, res, next) => {
  next();
}, uploadPhoto);

// Like or unlike a photo (login required)
router.patch("/:id/like", protect, togglePhotoLike);

// Add a comment to a photo (login required)
router.post("/:id/comments", protect, addPhotoComment);

// Delete a photo by ID
router.delete("/:id", deletePhoto);

export default router;
