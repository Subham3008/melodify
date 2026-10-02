import { z } from "zod";

export const createPlaybackEventSchema = z.object({
  trackId: z.string().min(1, "Track id is required"),

  eventType: z.enum(["PLAYED", "COMPLETED", "SKIPPED"]),

  positionSeconds: z.number().min(0).optional().default(0),
});
