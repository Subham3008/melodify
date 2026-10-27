import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import crypto from "node:crypto";

import { s3Client } from "../../config/s3.js";
import { env } from "../../config/env.js";

const getExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return filename.slice(lastDot).toLowerCase();
};

/*
|--------------------------------------------------------------------------
| Upload admin file
|--------------------------------------------------------------------------
*/

export const uploadAdminFile = async (
  file: Express.Multer.File,
  folder: "audio" | "covers",
): Promise<string> => {
  const id = crypto.randomUUID();

  const extension = getExtension(file.originalname);

  const key = `tracks/${folder}/${id}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,

      Key: key,

      Body: file.buffer,

      ContentType: file.mimetype,

      Metadata: {
        originalName: encodeURIComponent(file.originalname),
      },
    }),
  );

  return key;
};

/*
|--------------------------------------------------------------------------
| Delete single S3 object
|--------------------------------------------------------------------------
*/

export const deleteAdminObject = async (
  storageKey: string | null | undefined,
): Promise<void> => {
  if (!storageKey) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,

      Key: storageKey,
    }),
  );
};

/*
|--------------------------------------------------------------------------
| Delete every object under prefix
|--------------------------------------------------------------------------
|
| Example:
|
| tracks/hls/TRACK_ID/
|
*/

export const deleteAdminPrefix = async (prefix: string): Promise<void> => {
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.AWS_S3_BUCKET,

        Prefix: prefix,

        ContinuationToken: continuationToken,
      }),
    );

    const objects =
      response.Contents?.map((item) => ({
        Key: item.Key,
      })).filter(
        (
          item,
        ): item is {
          Key: string;
        } => Boolean(item.Key),
      ) ?? [];

    if (objects.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: env.AWS_S3_BUCKET,

          Delete: {
            Objects: objects,

            Quiet: true,
          },
        }),
      );
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
};
