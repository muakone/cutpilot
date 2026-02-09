import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffmpeg-installer/win32-x64",
    "@ffprobe-installer/ffprobe",
    "@ffprobe-installer/win32-x64",
    "fluent-ffmpeg",
  ],
};

export default nextConfig;
