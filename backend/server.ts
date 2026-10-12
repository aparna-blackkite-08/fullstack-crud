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

// app.get("/create-test-user", async (req, res) => {
//   try {
//     const user = await User.create({
//       name: "Ruchita",
//       email: "ruchi@example.com",
//       password: "123456",
//     });

//     res.json(user);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to create user",
//     });
//   }
// });

// console.log(PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
