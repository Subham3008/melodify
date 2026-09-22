import { env } from "../../config/env.js";

import { ApiError } from "../../utils/ApiError.js";

import type { JamendoTracksResponse, NormalizedTrack } from "./track.types.js";

interface GetJamendoTracksOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export const fetchJamendoTracks = async ({
  limit = 20,
  offset = 0,
  search,
}: GetJamendoTracksOptions = {}): Promise<NormalizedTrack[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const safeOffset = Math.max(offset, 0);

  const params = new URLSearchParams({
    client_id: env.JAMENDO_CLIENT_ID,

    format: "json",

    limit: String(safeLimit),

    offset: String(safeOffset),

    audioformat: "mp32",

    imagesize: "300",
  });

  if (search?.trim()) {
    params.set("search", search.trim());
  } else {
    params.set("order", "popularity_month");
  }

  const url = `${env.JAMENDO_BASE_URL}/tracks/?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(
        502,
        `Jamendo API request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as JamendoTracksResponse;

    if (data.headers.status !== "success") {
      throw new ApiError(
        502,
        data.headers.error_message || "Jamendo API returned an error",
      );
    }

    const tracks = data.results
      .filter((track) => Boolean(track.audio))
      .map(
        (track): NormalizedTrack => ({
          source: "jamendo",

          externalId: track.id,

          title: track.name,

          artistId: track.artist_id,

          artistName: track.artist_name,

          albumId: track.album_id || null,

          albumName: track.album_name || null,

          durationSeconds: Number(track.duration),

          imageUrl: track.image,

          streamUrl: track.audio,

          licenseUrl: track.license_ccurl || null,

          downloadAllowed: track.audiodownload_allowed ?? false,
        }),
      );

    return tracks;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Unable to communicate with Jamendo");
  }
};
