import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    console.log("Trying to connect to MongoDB...");

    console.log(
      "MongoDB URI exists:",
      !!process.env.MONGODB_URI
    );

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || ""
    );

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection error:");
    console.error(error);
  }
};