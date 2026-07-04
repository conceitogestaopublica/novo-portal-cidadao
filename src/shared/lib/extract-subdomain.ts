/**
 * Extrai o subdomínio (município) de um header `Host`.
 *
 * Função PURA — usável em Server Components, route handlers e middleware.
 * Portada 1:1 do front do tributário para manter a mesma semântica de tenant.
 *
 * - `sao-paulo.localhost[:porta]` → "sao-paulo"
 * - `sp-ribeirao.portal.gov.br`   → "sp-ribeirao"
 * - `localhost` / IP / domínio raiz → null
 */
export function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length === 2 && parts[1] === "localhost") return parts[0];
  if (parts.length >= 3) return parts[0];
  return null;
}
