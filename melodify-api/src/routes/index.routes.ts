import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import trackRoutes from "../modules/track/track.routes.js";
import likeRoutes from "../modules/like/like.routes.js";
import playlistRoutes from "../modules/playlist/playlist.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tracks", trackRoutes);
router.use("/likes", likeRoutes);
router.use("/playlists", playlistRoutes);

export default router;
