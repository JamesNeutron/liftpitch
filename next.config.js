/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prevent webpack from bundling pdfjs-dist on the server — it uses
    // import.meta which the webpack bundler cannot handle. Externalising it
    // means Node.js loads the package directly at runtime instead.
    serverComponentsExternalPackages: ["pdfjs-dist", "fluent-ffmpeg", "ffmpeg-static"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-eval (dev HMR + prod chunks) and unsafe-inline
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // blob: for recorded video playback; R2 and Cloudflare Stream for stored/streamed videos
              "media-src 'self' blob: https://pub-cfdd42a988b742699648f69597750833.r2.dev https://*.cloudflarestream.com",
              "img-src 'self' data: blob:",
              // blob: needed for MediaRecorder / Web Workers
              "worker-src 'self' blob:",
              // Cloudflare Stream upload endpoint + HLS playback + Supabase
              "connect-src 'self' https://epsfmdualbelgrfoshzt.supabase.co https://pub-cfdd42a988b742699648f69597750833.r2.dev https://*.r2.cloudflarestorage.com https://upload.videodelivery.net https://*.cloudflarestream.com https://api.cloudflare.com",
              // Cloudflare Stream embeds its player in an iframe
              "frame-src https://*.cloudflarestream.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            // Explicitly allow camera + microphone for this origin
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
