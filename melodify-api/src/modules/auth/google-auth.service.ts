import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export const verifyGoogleCredential = async (
  credential: string,
): Promise<GoogleUser> => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.email_verified) {
    throw new ApiError(401, "Invalid Google account");
  }

  return {
    googleId: payload.sub,

    email: payload.email.toLowerCase(),

    name: payload.name ?? payload.email.split("@")[0],

    avatarUrl: payload.picture,
  };
};
