import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build enxuto para o Dockerfile: `.next/standalone` já traz um server.js
  // com só o node_modules necessário, sem precisar copiar node_modules inteiro.
  output: "standalone",
  // O file tracing do standalone não segue o require dinâmico que o Prisma
  // Client faz do driver adapter — sem isto, `@prisma/adapter-pg` fica de
  // fora do `.next/standalone/node_modules` e todo acesso ao banco falha em
  // produção (MODULE_NOT_FOUND), mesmo com build local aparentando OK.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
