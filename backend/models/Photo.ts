
import mongoose, { Document, Schema } from "mongoose";

// Structure of one comment
export interface IComment {
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

// Structure of one photo
export interface IPhoto extends Document {
  title: string;
  description: string;
  imageUrl: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for a single comment
const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Schema for a photo
const photoSchema = new Schema<IPhoto>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    likes: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    // Store comments belonging to this photo
    comments: {
      type: [commentSchema],
      default: [],
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Photo = mongoose.model<IPhoto>("Photo", photoSchema);

export default Photo;