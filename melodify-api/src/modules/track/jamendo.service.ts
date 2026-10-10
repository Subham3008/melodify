import { env } from "../../config/env.js";

import { ApiError } from "../../utils/ApiError.js";

import type { JamendoTracksResponse, NormalizedTrack } from "./track.types.js";

/*
|--------------------------------------------------------------------------
| Track options
|--------------------------------------------------------------------------
*/

interface GetJamendoTracksOptions {
  limit?: number;
  offset?: number;
  search?: string;
  artistId?: string;
}

/*
|--------------------------------------------------------------------------
| Artist search options
|--------------------------------------------------------------------------
*/

interface SearchJamendoArtistsOptions {
  search: string;
  limit?: number;
}

/*
|--------------------------------------------------------------------------
| Artist API types
|--------------------------------------------------------------------------
*/

interface JamendoArtistApiResult {
  id: string;
  name: string;
  image: string;

  website?: string;
  shorturl?: string;
  shareurl?: string;
}

interface JamendoArtistsResponse {
  headers: {
    status: string;
    code: number;
    error_message: string;

    warnings?: string;
    results_count?: number;
  };

  results: JamendoArtistApiResult[];
}

export interface JamendoArtist {
  artistId: string;

  artistName: string;

  imageUrl: string;
}

/*
|--------------------------------------------------------------------------
| Small in-memory artist cache
|--------------------------------------------------------------------------
|
| Artist detail page / Popular Artists ke liye same artist metadata
| baar-baar Jamendo se fetch nahi karna.
|
| Server restart ke baad cache automatically reset ho jayega.
|
*/

const ARTIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const artistCache = new Map<
  string,
  {
    artist: JamendoArtist;

    expiresAt: number;
  }
>();

/*
|--------------------------------------------------------------------------
| Fetch Jamendo tracks
|--------------------------------------------------------------------------
*/

export const fetchJamendoTracks = async ({
  limit = 20,
  offset = 0,
  search,
  artistId,
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

  /*
    |--------------------------------------------------------------------------
    | Artist-specific tracks
    |--------------------------------------------------------------------------
    */

  if (artistId?.trim()) {
    params.set("artist_id", artistId.trim());
  }

  /*
    |--------------------------------------------------------------------------
    | Search OR popularity order
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| Fetch single Jamendo artist
|--------------------------------------------------------------------------
|
| Used by:
|
| - Popular Artists
| - Artist detail page
|
*/

export const fetchJamendoArtistById = async (
  artistId: string,
): Promise<JamendoArtist | null> => {
  const normalizedArtistId = artistId.trim();

  if (!normalizedArtistId) {
    return null;
  }

  /*
    |--------------------------------------------------------------------------
    | Cache first
    |--------------------------------------------------------------------------
    */

  const cached = artistCache.get(normalizedArtistId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.artist;
  }

  /*
    |--------------------------------------------------------------------------
    | Jamendo artist request
    |--------------------------------------------------------------------------
    */

  const params = new URLSearchParams({
    client_id: env.JAMENDO_CLIENT_ID,

    format: "json",

    id: normalizedArtistId,
  });

  const url = `${env.JAMENDO_BASE_URL}/artists/?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(
        502,
        `Jamendo artist API request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as JamendoArtistsResponse;

    if (data.headers.status !== "success") {
      throw new ApiError(
        502,
        data.headers.error_message || "Jamendo artist API returned an error",
      );
    }

    const result = data.results[0];

    if (!result) {
      return null;
    }

    const artist: JamendoArtist = {
      artistId: result.id,

      artistName: result.name,

      imageUrl: result.image || "",
    };

    /*
      |--------------------------------------------------------------------------
      | Cache artist metadata
      |--------------------------------------------------------------------------
      */

    artistCache.set(normalizedArtistId, {
      artist,

      expiresAt: Date.now() + ARTIST_CACHE_TTL_MS,
    });

    return artist;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Unable to communicate with Jamendo artist API");
  }
};

/*
|--------------------------------------------------------------------------
| Search Jamendo artists
|--------------------------------------------------------------------------
|
| Universal search ke liye.
|
| Example:
|
| search = "cole"
|
| ↓
|
| Cole Powell
| Cole Another Artist
|
*/

export const searchJamendoArtists = async ({
  search,
  limit = 6,
}: SearchJamendoArtistsOptions): Promise<JamendoArtist[]> => {
  const normalizedSearch = search.trim();

  if (!normalizedSearch) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  /*
    |--------------------------------------------------------------------------
    | Jamendo artist search params
    |--------------------------------------------------------------------------
    */

  const params = new URLSearchParams({
    client_id: env.JAMENDO_CLIENT_ID,

    format: "json",

    /*
        |--------------------------------------------------------------------------
        | Search artist by name
        |--------------------------------------------------------------------------
        */

    namesearch: normalizedSearch,

    limit: String(safeLimit),

    /*
        |--------------------------------------------------------------------------
        | Only useful artist results
        |--------------------------------------------------------------------------
        */

    hasimage: "true",

    /*
        |--------------------------------------------------------------------------
        | Better ordering
        |--------------------------------------------------------------------------
        */

    order: "popularity_total",
  });

  const url = `${env.JAMENDO_BASE_URL}/artists/?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(
        502,
        `Jamendo artist search failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as JamendoArtistsResponse;

    if (data.headers.status !== "success") {
      throw new ApiError(
        502,
        data.headers.error_message || "Jamendo artist search returned an error",
      );
    }

    /*
      |--------------------------------------------------------------------------
      | Normalize artist results
      |--------------------------------------------------------------------------
      */

    return data.results.map(
      (artist): JamendoArtist => ({
        artistId: artist.id,

        artistName: artist.name,

        imageUrl: artist.image || "",
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Unable to search Jamendo artists");
  }
};
