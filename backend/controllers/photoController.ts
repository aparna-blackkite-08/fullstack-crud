import { type Request, type Response } from "express";
import fs from "fs/promises";
import path from "path";
import Photo from "../models/Photo";
import { type AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

export const uploadPhoto = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    let savedFilePath: string | undefined;

try {
      const userId = req.userId;       
      if (!userId) {
        res.status(401).json({
          message: "Please log in first.",
        });
        return;
      }
    
      const { title, description } = req.body;
                
      // Check that all required fields exist
      if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
          res.status(400).json({
              message: "Title and description are required.",
          });
          return;
      }
    
      // Check whether a photo was uploaded
      if (!req.file) {
          res.status(400).json({
              message: "Please select a photo to upload.",
          });
          return;
      }

      savedFilePath = req.file.path;

      // Create the URL used to access the image
      const imageUrl = `/uploads/${req.file.filename}`;

      // Save photo details in MongoDB
      const photo = await Photo.create({
          title: title.trim(),
          description: description.trim(),
          imageUrl,
          uploadedBy: new mongoose.Types.ObjectId(userId),
      });

      res.status(201).json({
          message: "Photo uploaded successfully.",
          photo,
      });
    } catch (error) {
      // Remove the uploaded file if saving its details fails
    if (savedFilePath) {
        try {
            await fs.unlink(savedFilePath);
        } catch (cleanupError) {
            console.error("Could not remove uploaded file:", cleanupError);
        }
    }
    console.error("Photo upload error:", error);

    res.status(500).json({
        message: "Could not upload the photo.",
    });
  }
};

// Get all photos
// export const getAllPhotos = async (
//   _req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     // const photos = await Photo.find().sort({ createdAt: -1 });
//     const photos = await Photo.find().populate("comments.user", "name").sort({ createdAt: -1 });

//     res.status(200).json({ photos });
//   } catch (error) {
//     console.error("Error fetching photos:", error);
//     res.status(500).json({ message: "Could not fetch photos." });
//   }
// };

// Get all photos
export const getAllPhotos = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const photos = await Photo.find()
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ photos });
  } catch (error) {
    console.error("Error fetching photos:", error);

    res.status(500).json({
      message: "Could not fetch photos.",
      error:
        error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete one photo
export const deletePhoto = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Please log in first.",
      });
      return;
    }

    const { id } = req.params;

    // Validate the photo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid photo ID.",
      });
      return;
    }

    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      res.status(404).json({ message: "Photo not found." });
      return;
    }

    // Check whether the logged-in user owns this photo
    if (
      !photo.uploadedBy ||
      photo.uploadedBy.toString() !== userId
    ) {
      res.status(403).json({
        message: "You can only delete your own photos.",
      });
      return;
    }

    // Get only the filename stored in the image URL
    const filename = path.basename(photo.imageUrl);
    const filePath = path.resolve(
      process.cwd(),
      "uploads",
      filename
    );
    
    console.log(filePath);
    
    // Delete the database record
    await Photo.findByIdAndDelete(photo._id);

    // Delete the image file from the uploads folder
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error(
        "Photo record deleted, but image file could not be removed:",
        fileError
      );
    }

    res.status(200).json({
      message: "Photo deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ message: "Could not delete photo." });
  }
};


export const togglePhotoLike = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Please log in first.",
      });
      return;
    }

    const photo = await Photo.findById(id);

    if (!photo) {
      res.status(404).json({
        message: "Photo not found.",
      });
      return;
    }

    // Check whether this user has already liked the photo
    const alreadyLiked = photo.likes.some(
      (likedUserId) => likedUserId.toString() === userId
    );

    if (alreadyLiked) {
      // Remove this user's like
      await Photo.updateOne(
        { _id: id },
        { $pull: { likes: userId } }
      );
    } else {
      // Add this user's like without creating duplicates
      await Photo.updateOne(
        { _id: id },
        { $addToSet: { likes: userId } }
      );
    }

    // Return the latest photo data
    const updatedPhoto = await Photo.findById(id);

    if (!updatedPhoto) {
      res.status(404).json({
        message: "Photo not found.",
      });
      return;
    }

    res.status(200).json({
      message: alreadyLiked
        ? "Like removed successfully."
        : "Photo liked successfully.",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Error toggling photo like:", error);

    res.status(500).json({
      message: "Could not update photo like.",
    });
  }
};


export const addPhotoComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    // Check login
    if (!userId) {
      res.status(401).json({
        message: "Please log in first.",
      });
      return;
    }

    // Validate the comment
    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({
        message: "Comment cannot be empty.",
      });
      return;
    }

    if (text.trim().length > 1000) {
      res.status(400).json({
        message: "Comment cannot exceed 1000 characters.",
      });
      return;
    }

    // Find the photo
    const photo = await Photo.findById(id);

    if (!photo) {
      res.status(404).json({
        message: "Photo not found.",
      });
      return;
    }

    // Add the comment to this photo
    photo.comments.push({
      user: new Photo.base.Types.ObjectId(userId),
      text: text.trim(),
    });

    // Save the updated photo in MongoDB
    await photo.save();

    // Fetch the photo again and get the commenter's name
    const updatedPhoto = await Photo.findById(id).populate(
      "comments.user",
      "name"
    );

    if (!updatedPhoto) {
      res.status(404).json({
        message: "Photo not found.",
      });
      return;
    }

    res.status(201).json({
      message: "Comment added successfully.",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Error adding comment:", error);

    res.status(500).json({
      message: "Could not add comment.",
    });
  }
};
