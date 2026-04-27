import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const R2_PUBLIC_URL = "https://pub-cfdd42a988b742699648f69597750833.r2.dev";
const publicBaseUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || R2_PUBLIC_URL).replace(/\/$/, "");

const r2 = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  region: "auto",
});

/**
 * Upload a video buffer to R2 and return its public URL.
 * @param {Buffer} buffer
 * @param {string} filename  e.g. "user-id/1234567890.webm"
 * @param {string} contentType  e.g. "video/webm"
 */
export async function uploadVideo(buffer, filename, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return getVideoUrl(filename);
}

/**
 * Return the public URL for a stored video without uploading.
 * @param {string} filename
 */
export function getVideoUrl(filename) {
  return `${publicBaseUrl}/${filename}`;
}

/**
 * Generate a short-lived presigned PUT URL so the client can upload directly
 * to R2, bypassing the Next.js function body-size limit.
 * @param {string} filename
 * @param {string} contentType
 * @param {number} expiresIn  seconds (default 300)
 */
export async function getPresignedUploadUrl(filename, contentType, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}
