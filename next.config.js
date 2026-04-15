/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prevent webpack from bundling pdfjs-dist on the server — it uses
    // import.meta which the webpack bundler cannot handle. Externalising it
    // means Node.js loads the package directly at runtime instead.
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

module.exports = nextConfig;
