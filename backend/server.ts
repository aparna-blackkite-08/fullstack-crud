import express from 'express';
import cors from 'cors';
import 'dotenv/config';
// import dotenv from 'dotenv';
import { connectDB } from './database/db';
import { User } from "./models/User";
import authRoutes from "./routes/authRoutes";
import photoRoutes from "./routes/photoRoutes";
import path from "path";

// dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication routes
app.use("/api/auth", authRoutes);
// Make uploaded images accessible through their URLs
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Register photo upload API
app.use("/api/photos", photoRoutes);

const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();

// console.log(PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
