import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
// Public base URL for served videos — set CLOUDFLARE_R2_PUBLIC_URL to your
// R2 public bucket URL (e.g. https://pub-xxx.r2.dev) or a custom domain.
const publicBaseUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/$/, "");

// R2 uses S3-compatible auth. In the Cloudflare dashboard, create an R2 API
// token and note the Access Key ID and Secret Access Key it generates.
// Map them to CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY
// (or CLOUDFLARE_R2_TOKEN as an alias for the secret).
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ??
      process.env.CLOUDFLARE_R2_TOKEN ??
      "",
  },
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
