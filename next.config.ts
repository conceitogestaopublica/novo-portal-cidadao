import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build enxuto para o Dockerfile: `.next/standalone` já traz um server.js
  // com só o node_modules necessário, sem precisar copiar node_modules inteiro.
  output: "standalone",
};

export default nextConfig;
