const defaultApiProxyTarget = process.env.VERCEL
  ? "https://ror-backend-1.onrender.com"
  : "http://localhost:8000";
const apiProxyTarget = (process.env.API_PROXY_TARGET || defaultApiProxyTarget).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not let `next build` overwrite manifests used by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
