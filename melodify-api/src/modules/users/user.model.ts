import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      default: null,
      select: false,
    },

    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "artist", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = mongoose.model("User", userSchema);
