import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");

    process.exit(1);
  }
};
