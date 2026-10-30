import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "involynk_enterprise_jwt_secret_key_2026";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    businessName: string;
    role?: "business_owner" | "super_admin";
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  // Also check x-owner-id header for development/demo convenience
  const fallbackOwnerId = (req.headers["x-owner-id"] as string) || (req.query.ownerId as string);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name: string;
        businessName: string;
        role?: "business_owner" | "super_admin";
      };
      req.user = decoded;
      return next();
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired authorization token" });
      return;
    }
  }

  if (fallbackOwnerId) {
    req.user = {
      id: fallbackOwnerId,
      email: (req.headers["x-owner-email"] as string) || "owner@involynk.com",
      name: "Business Owner",
      businessName: "Retail Store Group",
      role: "business_owner",
    };
    return next();
  }

  res.status(401).json({ error: "Unauthorized: Missing authentication token" });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  // 1. Allow admin secret key header bypass for testing & dashboard integration
  if (req.headers["x-admin-key"] === "involynk_admin_secret_2026") {
    req.user = req.user || {
      id: "usr_admin_00",
      email: "admin@involynk.com",
      name: "System Administrator",
      businessName: "Involynk Central Platform Administration",
      role: "super_admin",
    };
    return next();
  }

  // 2. Allow if already decoded as super_admin
  if (req.user && req.user.role === "super_admin") {
    return next();
  }

  // 3. Check Authorization header bearer token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name: string;
        businessName: string;
        role?: "business_owner" | "super_admin";
      };
      req.user = decoded;
      if (decoded.role === "super_admin") {
        return next();
      }
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired authorization token" });
      return;
    }
  }

  res.status(403).json({ error: "Access denied: Super Admin credentials required to view global platform talks." });
}

