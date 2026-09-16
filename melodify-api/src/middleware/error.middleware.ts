import type { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  logger.error(
    {
      err: error,
    },
    "Unhandled application error",
  );

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
