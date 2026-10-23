
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Create the uploads folder if it does not exist
const uploadDirectory = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure where and how image files are saved
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    // Generate a unique filename
    callback(null, `${randomUUID()}${extension}`);
  },
});

// Accept image files only
const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  if (!file.mimetype.startsWith("image/")) {
    return callback(new Error("Only image files are allowed."));
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

export default upload;
