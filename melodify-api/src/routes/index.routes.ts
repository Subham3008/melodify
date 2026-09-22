import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import trackRoutes from "../modules/track/track.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tracks", trackRoutes);

export default router;
