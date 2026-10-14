import express from 'express';
import cors from 'cors';
import 'dotenv/config';
// import dotenv from 'dotenv';
import { connectDB } from './database/db';
import { User } from "./models/User";
import authRoutes from "./routes/authRoutes";

// dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();

// console.log(PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
