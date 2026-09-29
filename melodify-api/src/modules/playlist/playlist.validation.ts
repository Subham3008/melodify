import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Playlist name is required")
    .max(80, "Playlist name is too long"),

  description: z
    .string()
    .trim()
    .max(300, "Description is too long")
    .optional()
    .default(""),
});
