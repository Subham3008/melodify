import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { logger } from "./utils/logger.js";
import { env } from "./config/env.js";

import routes from "./routes/index.routes.js";

import { apiLimiter } from "./middleware/rateLimit.middleware.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

app.use(
  pinoHttp({
    logger,
  }),
);

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Request parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Melodify API is healthy",
  });
});

/*
|--------------------------------------------------------------------------
| API Rate Limiter
|--------------------------------------------------------------------------
*/

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

export default app;
