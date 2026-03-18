/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Socket.io server.ts is not used on Vercel (serverless).
  // Real-time features fall back gracefully to HTTP polling.
  webpack: (config) => {
    config.externals.push({ "utf-8-validate": "commonjs utf-8-validate", bufferutil: "commonjs bufferutil" });
    return config;
  },
};

module.exports = nextConfig;
