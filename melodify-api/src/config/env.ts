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
