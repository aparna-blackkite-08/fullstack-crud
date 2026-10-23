import {type Request,type Response } from "express";
import bcrypt from "bcryptjs";

import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { use } from "react";
import { type AuthRequest } from "../middleware/authMiddleware";

//Sign Up
export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, email, password } = req.body;
    console.log(req.body);
    // 1. Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // 4. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Create JWT
    const token = generateToken(user._id.toString());

    // 6. Send response
    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//Sign In
export const login = async (
    req: Request,
    res: Response
) => {
    try {
      const { email, password } = req.body;
      
      console.log("Login email received:", email);

        // 1. Check required fields 
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required", });
        }

        // 2. Find user
        const user = await User.findOne({
            email,
        });
      console.log("User found:", !!user);

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password", });
        }

        // 3. Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
      );
      
      console.log("Password matches:", passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password", });
        }

        // 4. Create JWT
        const token = generateToken(
            user._id.toString()
        );

        // 5. Send response
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error", });
    }
}


// GET logged-in user's profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile",
    });
  }
};

// UPDATE logged-in user's profile
export const updateProfile = async (req : AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    // MongoDB duplicate-key error: another user has this email
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 11000) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    return res.status(500).json({
      message: "Unable to update profile",
    });
  }
};