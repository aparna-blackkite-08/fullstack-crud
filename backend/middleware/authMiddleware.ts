import { type Request, type Response, type NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check whether the Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in first",
      });
    }

    // Extract the token after "Bearer "
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        message: "JWT_SECRET is not configured",
      });
    }

    // Verify the token using the same secret as generateToken()
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (typeof decoded.userId !== "string") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Store the verified MongoDB user ID on the request
    req.userId = decoded.userId;

    // Continue to the profile controller
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
};