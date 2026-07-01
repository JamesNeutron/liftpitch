// Shared Cloudflare Stream helpers used by both the authenticated
// (register-video) and the unauthenticated sponsored (sponsored/register-video)
// registration routes, so polling + share-link logic lives in one place.

// Poll Cloudflare Stream until the uploaded asset finishes processing.
// Returns the ready result, or null if it doesn't finish within maxWaitMs.
export async function pollStreamReady(uid, maxWaitMs = 55_000) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      { headers: { Authorization: `Bearer ${streamToken}` } }
    );
    if (!res.ok) {
      console.error("[stream] status check failed:", res.status);
      break;
    }
    const { result } = await res.json();
    console.log("[stream] status:", result.status?.state);
    if (result.status?.state === "ready") return result;
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

// HLS playback manifest URL for a ready Stream asset.
export function streamMp4Url(uid) {
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  return `https://customer-${customerCode}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
}

// First hop of x-forwarded-for (falling back to x-real-ip), or null.
export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwarded ? forwarded.split(",")[0].trim() : null) || realIp || null;
}

// Best-effort city/region/country from the request IP, for the /v verification card.
export async function getIpLocation(request) {
  const ip = clientIp(request);
  if (!ip) return "Location unavailable";
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,status`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return "Location unavailable";
    const data = await res.json();
    if (data.status !== "success") return "Location unavailable";
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location unavailable";
  } catch {
    return "Location unavailable";
  }
}

// Public /v/{id} share link for a video row id.
export function shareLinkFor(id) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lift-pitch.co").replace(/\/$/, "");
  return `${appUrl}/v/${id}`;
}
