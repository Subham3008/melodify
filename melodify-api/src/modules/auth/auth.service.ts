import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { UserModel } from "../users/user.model.js";
import { AuthSessionModel } from "./authSession.model.js";
import { verifyGoogleCredential } from "./google-auth.service.js";

import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createAuthSession = async (userId: string, role: string) => {
  const sessionId = new mongoose.Types.ObjectId();

  const accessToken = createAccessToken({
    sub: userId,
    role,
  });

  const refreshToken = createRefreshToken({
    sub: userId,
    sessionId: sessionId.toString(),
  });

  await AuthSessionModel.create({
    _id: sessionId,
    userId,
    refreshTokenHash: hashToken(refreshToken),

    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN * 1000),
  });

  return {
    accessToken,
    refreshToken,
  };
};

// -------------------------
// REGISTER
// -------------------------

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await UserModel.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
  });

  const tokens = await createAuthSession(user._id.toString(), user.role);

  return {
    user,
    ...tokens,
  };
};

// -------------------------
// EMAIL + PASSWORD LOGIN
// -------------------------

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await UserModel.findOne({
    email: normalizedEmail,
  }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = await createAuthSession(user._id.toString(), user.role);

  return {
    user,
    ...tokens,
  };
};

// -------------------------
// GOOGLE LOGIN
// -------------------------

export const loginWithGoogle = async (credential: string) => {
  const googleUser = await verifyGoogleCredential(credential);

  // 1. Check whether this Google account
  // is already linked with a Melodify user
  let user = await UserModel.findOne({
    googleId: googleUser.googleId,
  });

  if (!user) {
    // 2. Check whether same email already exists
    const existingEmailUser = await UserModel.findOne({
      email: googleUser.email,
    });

    if (existingEmailUser) {
      /*
        Same email account already exists.

        Link Google account with existing
        email/password account.
      */

      existingEmailUser.googleId = googleUser.googleId;

      // Optional:
      // Google profile picture add karo
      // only if user doesn't already have one.
      if (!existingEmailUser.avatarUrl && googleUser.avatarUrl) {
        existingEmailUser.avatarUrl = googleUser.avatarUrl;
      }

      await existingEmailUser.save();

      user = existingEmailUser;
    } else {
      /*
        Completely new user.
        Create Google-only account.
      */

      user = await UserModel.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,

        ...(googleUser.avatarUrl && {
          avatarUrl: googleUser.avatarUrl,
        }),
      });
    }
  }

  const tokens = await createAuthSession(user._id.toString(), user.role);

  return {
    user,
    ...tokens,
  };
};

// -------------------------
// REFRESH SESSION
// -------------------------

export const refreshAuthSession = async (refreshToken: string) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const session = await AuthSessionModel.findById(payload.sessionId);

  if (!session) {
    throw new ApiError(401, "Session expired");
  }

  if (session.userId.toString() !== payload.sub) {
    throw new ApiError(401, "Invalid session");
  }

  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    await session.deleteOne();

    throw new ApiError(401, "Refresh token reuse detected");
  }

  const user = await UserModel.findById(payload.sub);

  if (!user) {
    await session.deleteOne();

    throw new ApiError(401, "User no longer exists");
  }

  const accessToken = createAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const newRefreshToken = createRefreshToken({
    sub: user._id.toString(),
    sessionId: session._id.toString(),
  });

  session.refreshTokenHash = hashToken(newRefreshToken);

  session.expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_IN * 1000,
  );

  await session.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

// -------------------------
// LOGOUT
// -------------------------

export const logoutUser = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) {
    return;
  }

  await AuthSessionModel.deleteOne({
    refreshTokenHash: hashToken(refreshToken),
  });
};
