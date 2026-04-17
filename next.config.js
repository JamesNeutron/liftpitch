/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prevent webpack from bundling pdfjs-dist on the server — it uses
    // import.meta which the webpack bundler cannot handle. Externalising it
    // means Node.js loads the package directly at runtime instead.
    serverComponentsExternalPackages: ["pdfjs-dist"],
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
              // blob: needed for recorded video playback; data: for thumbnails
              "media-src 'self' blob:",
              "img-src 'self' data: blob:",
              // blob: needed for MediaRecorder / Web Workers
              "worker-src 'self' blob:",
              "connect-src 'self'",
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
