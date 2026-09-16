import type { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return;
  }

  try {
    const payload = verifyAccessToken(accessToken);

    req.user = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};
