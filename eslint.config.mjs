import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Fronteira de módulo (Regra de Ouro #5 do CLAUDE.md): um módulo nunca importa
    // componente/hook/service interno de outro — só o `index.ts` público. Schemas
    // ficam de fora de propósito: são o contrato compartilhado entre o formulário
    // do módulo e a rota BFF/API que valida o mesmo shape (ver CLAUDE.md).
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/components/*", "@/modules/*/hooks/*", "@/modules/*/services/*"],
              message:
                "Não importe artefatos internos de outro módulo. Use a exportação pública em `@/modules/<nome>` (index.ts). Dentro do próprio módulo, use import relativo (`../hooks/...`, `./...`), não o caminho absoluto.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
