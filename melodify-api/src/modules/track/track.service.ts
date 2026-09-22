import mongoose from "mongoose";

import { Track } from "./track.model.js";

import { fetchJamendoTracks } from "./jamendo.service.js";

import { ApiError } from "../../utils/ApiError.js";

import type { NormalizedTrack, TrackDTO } from "./track.types.js";

interface DiscoverTracksInput {
  limit?: number;
  offset?: number;
  search?: string;
}

interface GetTracksInput {
  search?: string;
  page?: number;
  limit?: number;
}

const mapTrackToDTO = (track: InstanceType<typeof Track>): TrackDTO => {
  return {
    id: String(track._id),

    source: track.source,

    externalId: track.externalId,

    title: track.title,

    artistId: track.artistId,

    artistName: track.artistName,

    albumId: track.albumId,

    albumName: track.albumName,

    durationSeconds: track.durationSeconds,

    imageUrl: track.imageUrl,

    streamUrl: track.streamUrl,

    licenseUrl: track.licenseUrl,

    downloadAllowed: track.downloadAllowed,
  };
};

const saveTracks = async (tracks: NormalizedTrack[]): Promise<void> => {
  if (tracks.length === 0) {
    return;
  }

  const operations = tracks.map((track) => ({
    updateOne: {
      filter: {
        source: track.source,

        externalId: track.externalId,
      },

      update: {
        $set: {
          ...track,

          lastSyncedAt: new Date(),
        },
      },

      upsert: true,
    },
  }));

  await Track.bulkWrite(operations);
};

export const discoverTracks = async (
  input: DiscoverTracksInput,
): Promise<TrackDTO[]> => {
  const jamendoTracks = await fetchJamendoTracks(input);

  await saveTracks(jamendoTracks);

  const externalIds = jamendoTracks.map((track) => track.externalId);

  const storedTracks = await Track.find({
    source: "jamendo",

    externalId: {
      $in: externalIds,
    },
  });

  const trackMap = new Map(
    storedTracks.map((track) => [track.externalId, track]),
  );

  return jamendoTracks
    .map((track) => trackMap.get(track.externalId))
    .filter((track): track is NonNullable<typeof track> => Boolean(track))
    .map(mapTrackToDTO);
};

export const getTracks = async ({
  search,
  page = 1,
  limit = 20,
}: GetTracksInput): Promise<TrackDTO[]> => {
  const safePage = Math.max(page, 1);

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const skip = (safePage - 1) * safeLimit;

  const query: Record<string, unknown> = {};

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escapedSearch, "i");

    query.$or = [
      {
        title: regex,
      },
      {
        artistName: regex,
      },
      {
        albumName: regex,
      },
    ];
  }

  const tracks = await Track.find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(safeLimit);

  return tracks.map(mapTrackToDTO);
};

export const getTrackById = async (trackId: string): Promise<TrackDTO> => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  const track = await Track.findById(trackId);

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  return mapTrackToDTO(track);
};
