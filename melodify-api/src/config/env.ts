import "dotenv/config";
import { z } from "zod";
import pino from "pino";

const bootstrapLogger = pino();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(4000),

  CLIENT_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  LOG_LEVEL: z.string().default("info"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET should be at least 32 characters"),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET should be at least 32 characters"),

  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(900),

  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(604800),

  // Jamendo
  JAMENDO_CLIENT_ID: z.string().min(1, "JAMENDO_CLIENT_ID is required"),

  JAMENDO_BASE_URL: z.string().default("https://api.jamendo.com/v3.0"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  bootstrapLogger.error(
    {
      errors: z.flattenError(parsedEnv.error).fieldErrors,
    },
    "Invalid environment variables",
  );

  process.exit(1);
}

export const env = parsedEnv.data;
