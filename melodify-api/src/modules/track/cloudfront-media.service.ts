import { env } from "../../config/env.js";

const normalizeDomain = (domain: string): string => {
  return domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
};

const encodeStorageKey = (storageKey: string): string => {
  return storageKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
};

export const getCloudFrontMediaUrl = (storageKey: string): string => {
  const normalizedKey = storageKey.trim();

  if (!normalizedKey) {
    return "";
  }

  const domain = normalizeDomain(env.CLOUDFRONT_DOMAIN);

  const encodedKey = encodeStorageKey(normalizedKey);

  return `https://${domain}/${encodedKey}`;
};
