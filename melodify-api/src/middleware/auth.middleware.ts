import type { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../utils/jwt.js";

/*
|--------------------------------------------------------------------------
| Require authentication
|--------------------------------------------------------------------------
|
| Checks:
|
| - access token exists
| - token is valid
|
| Then attaches:
|
| req.user = {
|   userId,
|   role
| }
|
*/

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

/*
|--------------------------------------------------------------------------
| Require roles
|--------------------------------------------------------------------------
|
| Generic authorization middleware.
|
| Example:
|
| requireRole("admin")
|
| or:
|
| requireRole("admin", "artist")
|
*/

export const requireRole =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    /*
    |--------------------------------------------------------------------------
    | Authentication must run first
    |--------------------------------------------------------------------------
    */

    if (!req.user) {
      res.status(401).json({
        success: false,

        message: "Unauthorized",
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Role check
    |--------------------------------------------------------------------------
    */

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,

        message: "You do not have permission to perform this action",
      });

      return;
    }

    next();
  };

/*
|--------------------------------------------------------------------------
| Admin shortcut
|--------------------------------------------------------------------------
|
| Instead of writing:
|
| requireRole("admin")
|
| everywhere, admin routes can directly use:
|
| requireAdmin
|
*/

export const requireAdmin = requireRole("admin");
