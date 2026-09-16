import type { Request, Response, NextFunction } from "express";

import type { ZodType } from "zod";

export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
      });

      return;
    }

    req.body = result.data;

    next();
  };
