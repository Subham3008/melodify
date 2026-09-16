import { UserModel } from "../users/user.model.js";
import { AuthSessionModel } from "./authSession.model.js";

export const findUserByEmail = (email: string) => {
  return UserModel.findOne({ email });
};

export const findUserForPasswordLogin = (email: string) => {
  return UserModel.findOne({ email }).select("+passwordHash");
};

export const findUserByGoogleId = (googleId: string) => {
  return UserModel.findOne({ googleId });
};

export const findUserById = (userId: string) => {
  return UserModel.findById(userId);
};

export const findSessionById = (sessionId: string) => {
  return AuthSessionModel.findById(sessionId);
};
