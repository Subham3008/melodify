import { PutObjectCommand } from "@aws-sdk/client-s3";

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

      /*
        |--------------------------------------------------------------------------
        | Do NOT make object public
        |--------------------------------------------------------------------------
        */

      Metadata: {
        originalName: encodeURIComponent(file.originalname),
      },
    }),
  );

  return key;
};
