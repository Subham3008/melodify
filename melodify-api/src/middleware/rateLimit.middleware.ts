import rateLimit from "express-rate-limit";

/**
 * General API limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * Authentication limiter
 * Login/Register/Google Auth ke liye stricter
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});
