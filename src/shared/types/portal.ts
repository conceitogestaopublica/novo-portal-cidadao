/** Tipos do domínio do Portal (Carta de Serviços) — espelham o schema do GED. */

export interface Ug {
  nome: string;
  cidade?: string | null;
  uf?: string | null;
  brasao?: string | null;
  /**
   * Cor institucional do município (hex), aplicada no topo e nos destaques.
   * Sem valor → cai no azul padrão do portal. Não confundir com `Categoria.cor`,
   * que é a cor da categoria no catálogo.
   */
  cor?: string | null;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
  banners?: Banner[];
}

export interface Banner {
  id: number | string;
  imagem: string;
  titulo?: string | null;
  subtitulo?: string | null;
  link_url?: string | null;
  link_label?: string | null;
}

export interface Categoria {
  id: number | string;
  nome: string;
  slug: string;
  icone?: string | null;
  cor?: string | null;
  descricao?: string | null;
  servicos_publicados_count?: number;
}

export type TipoFluxo = "processo_ged" | "self_service_fiscal" | "protocolo_gpe2";
export type FiscalAcao =
  | "segunda_via"
  | "certidao"
  | "parcelamento"
  | "debitos"
  | "caixa_postal"
  | "nfse"
  | "dms"
  | "prestei"
  | "desif";

export interface Servico {
  id: number | string;
  titulo: string;
  slug: string;
  publico_alvo: "cidadao" | "empresa" | "servidor";
  permite_anonimo?: boolean;
  descricao_curta?: string | null;
  descricao_completa?: string | null;
  requisitos?: string | null;
  documentos_necessarios?: string[] | null;
  prazo_entrega?: string | null;
  custo?: string | null;
  canais?: Record<string, unknown> | null;
  orgao_responsavel?: string | null;
  legislacao?: string | null;
  palavras_chave?: string[] | null;
  icone?: string | null;
  categoria?: Pick<Categoria, "id" | "nome" | "slug" | "cor"> | null;
  tipo_fluxo?: TipoFluxo;
  fiscal_acao?: FiscalAcao | null;
}

export interface Cidadao {
  id: string;
  nome: string;
  documento?: string;
}

/**
 * Uma identidade que o cidadão pode "atuar como": ele mesmo (titular) ou uma
 * empresa que representa (hoje, como contador). O `id` é o contribuinteId no
 * tributário — é o alvo do JWT CONTRIBUINTE quando ativo.
 */
export interface Representacao {
  id: string;
  nome: string;
  documento?: string | null;
  tipo: "titular" | "empresa";
  papel?: string | null;
}

/** Sessão do portal exposta ao cliente (nunca inclui tokens de backend). */
export interface MeResponse {
  conta: Cidadao | null;
  /** Pessoa logada (não muda ao alternar de empresa). */
  pessoa?: Cidadao | null;
  /** Identidades disponíveis no seletor "atuar como". */
  representados?: Representacao[];
  /** contribuinteId atualmente ativo (= conta.id). */
  atuandoComoId?: string | null;
  tenant: { municipio: string; nome: string } | null;
}
