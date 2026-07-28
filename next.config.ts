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
  // `serverExternalPackages` sozinho só copiou o `dist/index.mjs` de cada
  // pacote (export condition "import") — o runtime do Next carrega via
  // `require` (CJS) e precisa do `dist/index.js`, que o tracer não segue por
  // causa do export map condicional. Vale pro adapter-pg E suas próprias
  // dependências (@prisma/driver-adapter-utils, etc.) — força todo o escopo
  // @prisma/* de uma vez em vez de descobrir dependência por dependência.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/**/dist/**"],
  },
};

export default nextConfig;
