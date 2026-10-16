import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["@prisma/client", "prisma", "@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
