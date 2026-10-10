import { Track } from "./track.model.js";

import { getTracks } from "./track.service.js";

import { searchJamendoArtists, type JamendoArtist } from "./jamendo.service.js";

import type { TrackDTO } from "./track.types.js";

export interface UniversalSearchResult {
  artists: JamendoArtist[];

  tracks: TrackDTO[];
}

interface UniversalSearchInput {
  query: string;

  page?: number;

  trackLimit?: number;

  artistLimit?: number;
}

/*
|--------------------------------------------------------------------------
| Escape regex
|--------------------------------------------------------------------------
*/

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
|--------------------------------------------------------------------------
| Search known artists from MongoDB
|--------------------------------------------------------------------------
|
| This is mainly fallback.
|
| Artist images Jamendo artist search se better milti hain.
|
*/

const searchKnownArtists = async (
  query: string,
  limit: number,
): Promise<JamendoArtist[]> => {
  const regex = new RegExp(escapeRegex(query), "i");

  const artists = await Track.aggregate<{
    _id: string;

    artistName: string;
  }>([
    {
      $match: {
        artistName: regex,
      },
    },

    {
      $group: {
        _id: "$artistId",

        artistName: {
          $first: "$artistName",
        },
      },
    },

    {
      $limit: limit,
    },
  ]);

  return artists.map((artist) => ({
    artistId: artist._id,

    artistName: artist.artistName,

    imageUrl: "",
  }));
};

/*
|--------------------------------------------------------------------------
| Merge artists
|--------------------------------------------------------------------------
|
| Jamendo artist result preferred because it contains actual artist image.
|
*/

const mergeArtists = (
  jamendoArtists: JamendoArtist[],

  knownArtists: JamendoArtist[],

  limit: number,
): JamendoArtist[] => {
  const artistMap = new Map<string, JamendoArtist>();

  for (const artist of jamendoArtists) {
    artistMap.set(artist.artistId, artist);
  }

  for (const artist of knownArtists) {
    if (!artistMap.has(artist.artistId)) {
      artistMap.set(artist.artistId, artist);
    }
  }

  return [...artistMap.values()].slice(0, limit);
};

/*
|--------------------------------------------------------------------------
| Universal search
|--------------------------------------------------------------------------
*/

export const searchAll = async ({
  query,
  page = 1,
  trackLimit = 20,
  artistLimit = 6,
}: UniversalSearchInput): Promise<UniversalSearchResult> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      artists: [],

      tracks: [],
    };
  }

  const safePage = Math.max(Math.floor(page), 1);

  const safeTrackLimit = Math.min(Math.max(Math.floor(trackLimit), 1), 50);

  const safeArtistLimit = Math.min(Math.max(Math.floor(artistLimit), 1), 12);

  /*
    |--------------------------------------------------------------------------
    | Run track + artist search together
    |--------------------------------------------------------------------------
    */

  const [tracks, jamendoArtistsResult, knownArtists] = await Promise.all([
    getTracks({
      search: normalizedQuery,

      page: safePage,

      limit: safeTrackLimit,
    }),

    searchJamendoArtists({
      search: normalizedQuery,

      limit: safeArtistLimit,
    }).catch(() => []),

    searchKnownArtists(normalizedQuery, safeArtistLimit),
  ]);

  const artists = mergeArtists(
    jamendoArtistsResult,
    knownArtists,
    safeArtistLimit,
  );

  return {
    artists,

    tracks,
  };
};
