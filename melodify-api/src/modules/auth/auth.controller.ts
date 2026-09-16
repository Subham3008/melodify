import type { Request, Response } from "express";

import {
  registerUser,
  loginUser,
  loginWithGoogle,
  refreshAuthSession,
  logoutUser,
} from "./auth.service.js";

import { UserModel } from "../users/user.model.js";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const isProduction = env.NODE_ENV === "production";

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",

    maxAge: env.ACCESS_TOKEN_EXPIRES_IN * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",

    maxAge: env.REFRESH_TOKEN_EXPIRES_IN * 1000,
  });
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });
};

// -------------------------
// REGISTER
// -------------------------

export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body;

  const result = await registerUser(name, email, password);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(201).json({
    success: true,
    message: "Account created successfully",

    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      role: result.user.role,
    },
  });
};

// -------------------------
// LOGIN
// -------------------------

export const loginController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",

    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      role: result.user.role,
    },
  });
};

// -------------------------
// GOOGLE LOGIN
// -------------------------

export const googleAuthController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { credential } = req.body;

  const result = await loginWithGoogle(credential);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Google authentication successful",

    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      role: result.user.role,
    },
  });
};

// -------------------------
// REFRESH TOKEN
// -------------------------

export const refreshController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const tokens = await refreshAuthSession(refreshToken);

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(200).json({
    success: true,
    message: "Session refreshed",
  });
};

// -------------------------
// LOGOUT
// -------------------------

export const logoutController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await logoutUser(req.cookies?.refreshToken);

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// -------------------------
// CURRENT USER
// -------------------------

export const meController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await UserModel.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });
};
