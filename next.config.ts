import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not let `next build` overwrite manifests used by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*"
      }
    ];
  }
};

export default nextConfig;
