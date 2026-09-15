import express from "express";
import { pinoHttp } from "pino-http";

import { logger } from "./utils/logger.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(express.json());

app.use("/api", apiLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

export default app;
