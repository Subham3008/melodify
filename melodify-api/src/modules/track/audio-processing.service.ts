import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { createWriteStream } from "node:fs";

import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import { pipeline } from "node:stream/promises";

import { Readable } from "node:stream";

import { spawn } from "node:child_process";

import { s3Client } from "../../config/s3.js";

import { env } from "../../config/env.js";

import { Track } from "./track.model.js";

import { ApiError } from "../../utils/ApiError.js";

/*
|--------------------------------------------------------------------------
| HLS qualities
|--------------------------------------------------------------------------
*/

const HLS_VARIANTS = [
  {
    name: "64k",
    bitrate: "64k",
    bandwidth: 64000,
  },

  {
    name: "96k",
    bitrate: "96k",
    bandwidth: 96000,
  },

  {
    name: "128k",
    bitrate: "128k",
    bandwidth: 128000,
  },

  {
    name: "192k",
    bitrate: "192k",
    bandwidth: 192000,
  },
] as const;

/*
|--------------------------------------------------------------------------
| Run FFmpeg
|--------------------------------------------------------------------------
*/

const runFFmpeg = (args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const process = spawn(env.FFMPEG_PATH, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let errorOutput = "";

    process.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    process.on("error", reject);

    process.on("close", (code) => {
      if (code === 0) {
        resolve();

        return;
      }

      reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
    });
  });
};

/*
|--------------------------------------------------------------------------
| Download original audio from private S3
|--------------------------------------------------------------------------
*/

const downloadS3Object = async (
  storageKey: string,

  destination: string,
): Promise<void> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,

      Key: storageKey,
    }),
  );

  if (!response.Body) {
    throw new Error("S3 object body is empty");
  }

  /*
    |--------------------------------------------------------------------------
    | AWS SDK v3 returns a streaming body in Node.
    |--------------------------------------------------------------------------
    */

  await pipeline(
    response.Body as Readable,

    createWriteStream(destination),
  );
};

/*
|--------------------------------------------------------------------------
| Content type
|--------------------------------------------------------------------------
*/

const getContentType = (filename: string): string => {
  if (filename.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl";
  }

  if (filename.endsWith(".ts")) {
    return "video/mp2t";
  }

  return "application/octet-stream";
};

/*
|--------------------------------------------------------------------------
| Upload generated HLS directory
|--------------------------------------------------------------------------
*/

const uploadDirectory = async (
  directory: string,

  s3Prefix: string,
): Promise<void> => {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    const storageKey = `${s3Prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      await uploadDirectory(fullPath, storageKey);

      continue;
    }

    const body = await readFile(fullPath);

    const isPlaylist = entry.name.endsWith(".m3u8");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,

        Key: storageKey,

        Body: body,

        ContentType: getContentType(entry.name),

        CacheControl: isPlaylist
          ? "public, max-age=60"
          : "public, max-age=31536000, immutable",
      }),
    );
  }
};

/*
|--------------------------------------------------------------------------
| Generate one HLS quality
|--------------------------------------------------------------------------
*/

const generateVariant = async (
  inputFile: string,

  outputRoot: string,

  variant: (typeof HLS_VARIANTS)[number],
): Promise<void> => {
  const variantDirectory = path.join(outputRoot, variant.name);

  await mkdir(variantDirectory, {
    recursive: true,
  });

  const playlistPath = path.join(variantDirectory, "index.m3u8");

  const segmentPath = path.join(variantDirectory, "segment_%03d.ts");

  await runFFmpeg([
    "-y",

    "-i",
    inputFile,

    "-vn",

    "-c:a",
    "aac",

    "-b:a",
    variant.bitrate,

    "-ar",
    "44100",

    "-ac",
    "2",

    "-f",
    "hls",

    "-hls_time",
    "6",

    "-hls_playlist_type",
    "vod",

    "-hls_segment_filename",
    segmentPath,

    playlistPath,
  ]);
};

/*
|--------------------------------------------------------------------------
| Generate master.m3u8
|--------------------------------------------------------------------------
*/

const createMasterPlaylist = async (outputRoot: string): Promise<void> => {
  const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (const variant of HLS_VARIANTS) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},CODECS="mp4a.40.2"`,
    );

    lines.push(`${variant.name}/index.m3u8`);
  }

  lines.push("");

  await writeFile(
    path.join(outputRoot, "master.m3u8"),

    lines.join("\n"),

    "utf8",
  );
};

/*
|--------------------------------------------------------------------------
| Process track
|--------------------------------------------------------------------------
*/

export const processTrackAudio = async (trackId: string): Promise<void> => {
  const track = await Track.findById(trackId);

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  if (track.source !== "s3") {
    throw new ApiError(400, "Only S3 tracks can be processed");
  }

  if (!track.audioStorageKey) {
    throw new ApiError(400, "Track does not have an audio storage key");
  }

  /*
    |--------------------------------------------------------------------------
    | Processing started
    |--------------------------------------------------------------------------
    */

  await Track.findByIdAndUpdate(trackId, {
    $set: {
      processingStatus: "processing",

      processingError: null,
    },
  });

  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), `melodify-${trackId}-`),
  );

  try {
    const inputPath = path.join(tempDirectory, "original-audio");

    const outputRoot = path.join(tempDirectory, "hls");

    await mkdir(outputRoot, {
      recursive: true,
    });

    /*
      |--------------------------------------------------------------------------
      | Download original
      |--------------------------------------------------------------------------
      */

    await downloadS3Object(track.audioStorageKey, inputPath);

    /*
      |--------------------------------------------------------------------------
      | Generate variants
      |--------------------------------------------------------------------------
      |
      | Sequential intentionally:
      | avoids running 4 FFmpeg processes simultaneously for one track.
      |
      */

    for (const variant of HLS_VARIANTS) {
      await generateVariant(inputPath, outputRoot, variant);
    }

    /*
      |--------------------------------------------------------------------------
      | Master playlist
      |--------------------------------------------------------------------------
      */

    await createMasterPlaylist(outputRoot);

    /*
      |--------------------------------------------------------------------------
      | Upload generated files
      |--------------------------------------------------------------------------
      */

    const hlsPrefix = `tracks/hls/${trackId}`;

    await uploadDirectory(outputRoot, hlsPrefix);

    const masterStorageKey = `${hlsPrefix}/master.m3u8`;

    /*
      |--------------------------------------------------------------------------
      | Ready
      |--------------------------------------------------------------------------
      */

    await Track.findByIdAndUpdate(trackId, {
      $set: {
        processingStatus: "ready",

        hlsMasterStorageKey: masterStorageKey,

        processingError: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown audio processing error";

    await Track.findByIdAndUpdate(trackId, {
      $set: {
        processingStatus: "failed",

        processingError: message.slice(0, 1000),
      },
    });

    throw error;
  } finally {
    /*
      |--------------------------------------------------------------------------
      | Cleanup temporary files
      |--------------------------------------------------------------------------
      */

    await rm(tempDirectory, {
      recursive: true,

      force: true,
    });
  }
};
