import { GetObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client } from "../../config/s3.js";

import { env } from "../../config/env.js";

/*
|--------------------------------------------------------------------------
| Signed URL expiry
|--------------------------------------------------------------------------
|
| 60 minutes
|
| Frontend ko permanent S3 access nahi milega.
|
*/

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

/*
|--------------------------------------------------------------------------
| Generate private S3 playback/media URL
|--------------------------------------------------------------------------
*/

export const getS3MediaUrl = async (storageKey: string): Promise<string> => {
  const normalizedKey = storageKey.trim();

  if (!normalizedKey) {
    return "";
  }

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,

    Key: normalizedKey,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS,
  });
};
