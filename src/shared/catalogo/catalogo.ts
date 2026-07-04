import "server-only";
import type { Categoria, Servico } from "@/shared/types/portal";

/**
 * Catálogo (Carta de Serviços) — M1: fonte de dados curada, servida pelo BFF.
 *
 * A arquitetura já é a definitiva (o BFF é dono do endpoint do catálogo). A
 * carga real virá do GED (migração/sync via `/api/portal/catalogo/export`) para
 * o banco do portal (Prisma, `PortalCategoria`/`PortalServico`) — trocar apenas
 * a implementação abaixo, mantendo a mesma interface.
 */

interface ServicoSeed extends Servico {
  categoriaSlug: string;
}

const CATEGORIAS: Categoria[] = [
  { id: "tributos", nome: "Tributos e Débitos", slug: "tributos", icone: "fas fa-file-invoice-dollar", cor: "blue", descricao: "Consulte débitos, emita 2ª via de guias, certidões e parcele online." },
  { id: "imoveis", nome: "Imóveis (IPTU)", slug: "imoveis", icone: "fas fa-home", cor: "green", descricao: "IPTU, valor venal, situação cadastral e certidões do imóvel." },
  { id: "empresas", nome: "Empresas (ISS)", slug: "empresas", icone: "fas fa-store", cor: "amber", descricao: "NFS-e, DMS, ISS e serviços do cadastro econômico." },
  { id: "cidade", nome: "Cidade e Ouvidoria", slug: "cidade", icone: "fas fa-city", cor: "indigo", descricao: "Solicitações, reclamações e serviços gerais ao cidadão." },
];

const SERVICOS: ServicoSeed[] = [
  {
    id: "meus-debitos", categoriaSlug: "tributos", titulo: "Consultar meus débitos", slug: "meus-debitos",
    publico_alvo: "cidadao", icone: "fas fa-magnifying-glass-dollar",
    descricao_curta: "Veja todos os seus débitos em aberto com a prefeitura.",
    descricao_completa: "Após entrar com seu CPF/CNPJ, você vê a relação completa dos seus débitos (IPTU, ISS, taxas e dívida ativa), com valores atualizados.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "debitos", palavras_chave: ["débito", "consulta", "dívida"],
  },
  {
    id: "segunda-via", categoriaSlug: "tributos", titulo: "2ª via de guias (IPTU, ISS, taxas)", slug: "segunda-via-guias",
    publico_alvo: "cidadao", icone: "fas fa-receipt",
    descricao_curta: "Emita a 2ª via do seu boleto com código de barras e PIX.",
    descricao_completa: "Gere a 2ª via das suas guias em aberto. Guias vencidas são atualizadas com juros e multa antes da emissão. O boleto traz código de barras e QR PIX.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "segunda_via", palavras_chave: ["2ª via", "boleto", "guia", "pix"],
  },
  {
    id: "certidao", categoriaSlug: "tributos", titulo: "Certidão negativa de débitos (CND)", slug: "certidao-negativa",
    publico_alvo: "cidadao", icone: "fas fa-file-shield",
    descricao_curta: "Emita sua CND ou certidão positiva com efeito de negativa.",
    descricao_completa: "O sistema apura sua situação fiscal e emite a certidão (CND ou CPEN) assinada digitalmente, com QR Code de verificação pública.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda", legislacao: "CTN, arts. 205 e 206",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "certidao", palavras_chave: ["certidão", "cnd", "negativa"],
  },
  {
    id: "parcelamento", categoriaSlug: "tributos", titulo: "Parcelamento de débitos", slug: "parcelamento",
    publico_alvo: "cidadao", icone: "fas fa-handshake",
    descricao_curta: "Simule e parcele seus débitos em dívida ativa online.",
    descricao_completa: "Consulte os débitos elegíveis, simule o parcelamento (nº de parcelas e valores) e faça a adesão com termo de confissão de dívida. As guias das parcelas são geradas na hora.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Procuradoria / Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "parcelamento", palavras_chave: ["parcelar", "refis", "dívida ativa"],
  },
  {
    id: "caixa-postal", categoriaSlug: "tributos", titulo: "Caixa Postal Eletrônica (DTE)", slug: "caixa-postal",
    publico_alvo: "cidadao", icone: "fas fa-inbox",
    descricao_curta: "Receba comunicados oficiais da prefeitura com validade legal.",
    descricao_completa: "Seu Domicílio Tributário Eletrônico: notificações e comunicados oficiais, com registro de ciência (data, IP e hash) com validade probatória.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "caixa_postal", palavras_chave: ["dte", "caixa postal", "notificação"],
  },
  {
    id: "certidao-imovel", categoriaSlug: "imoveis", titulo: "Certidão de valor venal / cadastral", slug: "certidao-imovel",
    publico_alvo: "cidadao", icone: "fas fa-map-location-dot",
    descricao_curta: "Certidão do imóvel (valor venal, dados cadastrais, débitos).",
    descricao_completa: "Emita a certidão cadastral do imóvel com valor venal e situação de débitos, assinada digitalmente e com verificação pública por QR.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "certidao", palavras_chave: ["imóvel", "valor venal", "certidão"],
  },
  {
    id: "nfse", categoriaSlug: "empresas", titulo: "NFS-e — Nota Fiscal de Serviços", slug: "nfse",
    publico_alvo: "empresa", icone: "fas fa-file-invoice",
    descricao_curta: "Emissão e consulta de NFS-e (Padrão Nacional).",
    descricao_completa: "Prestadores emitem, consultam e cancelam suas NFS-e. Verificação pública da nota por chave/QR, sem login.",
    prazo_entrega: "Imediato", custo: "Gratuito", orgao_responsavel: "Secretaria da Fazenda",
    tipo_fluxo: "self_service_fiscal", fiscal_acao: "debitos", palavras_chave: ["nfse", "nota fiscal", "iss"],
  },
  {
    id: "ouvidoria", categoriaSlug: "cidade", titulo: "Ouvidoria — reclamação, denúncia ou elogio", slug: "ouvidoria",
    publico_alvo: "cidadao", permite_anonimo: true, icone: "fas fa-comment-dots",
    descricao_curta: "Registre uma manifestação e acompanhe a resposta.",
    descricao_completa: "Abra uma manifestação de ouvidoria. Você pode se identificar para receber a resposta ou registrar de forma anônima. A prefeitura responde pelo próprio portal.",
    prazo_entrega: "Até 30 dias", custo: "Gratuito", orgao_responsavel: "Ouvidoria Municipal", legislacao: "Lei 13.460/2017",
    tipo_fluxo: "processo_ged", palavras_chave: ["ouvidoria", "reclamação", "denúncia"],
  },
  {
    id: "protocolo", categoriaSlug: "cidade", titulo: "Abrir requerimento / protocolo", slug: "protocolo",
    publico_alvo: "cidadao", icone: "fas fa-folder-plus",
    descricao_curta: "Protocole um requerimento e acompanhe a tramitação.",
    descricao_completa: "Abra um processo administrativo (requerimento) e acompanhe cada etapa da tramitação, recebendo a decisão pelo portal.",
    prazo_entrega: "Conforme o serviço", custo: "Gratuito", orgao_responsavel: "Protocolo Geral",
    tipo_fluxo: "processo_ged", palavras_chave: ["protocolo", "requerimento", "processo"],
  },
];

const PUBLICOS: Record<string, string> = { cidadao: "Cidadão", empresa: "Empresa", servidor: "Servidor" };

function toPublic(s: ServicoSeed): Servico {
  const cat = CATEGORIAS.find((c) => c.slug === s.categoriaSlug);
  const { categoriaSlug: _omit, ...rest } = s;
  void _omit;
  return { ...rest, categoria: cat ? { id: cat.id, nome: cat.nome, slug: cat.slug, cor: cat.cor } : null };
}

export function getHome() {
  const categorias = CATEGORIAS.map((c) => ({
    ...c,
    servicos_publicados_count: SERVICOS.filter((s) => s.categoriaSlug === c.slug).length,
  }));
  const maisAcessados = SERVICOS.slice(0, 6).map(toPublic);
  return { categorias, maisAcessados, totalServicos: SERVICOS.length, publicos: PUBLICOS };
}

export function listServicos(opts?: { q?: string; categoria?: string; publico?: string }) {
  let list = SERVICOS;
  if (opts?.categoria) list = list.filter((s) => s.categoriaSlug === opts.categoria);
  if (opts?.publico) list = list.filter((s) => s.publico_alvo === opts.publico);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((s) =>
      [s.titulo, s.descricao_curta, s.descricao_completa, (s.palavras_chave ?? []).join(" ")]
        .join(" ").toLowerCase().includes(q),
    );
  }
  return { items: list.map(toPublic), total: list.length, publicos: PUBLICOS };
}

export function getCategoria(slug: string) {
  const categoria = CATEGORIAS.find((c) => c.slug === slug);
  if (!categoria) return null;
  const servicos = SERVICOS.filter((s) => s.categoriaSlug === slug).map(toPublic);
  return { categoria, servicos, publicos: PUBLICOS };
}

export function getServico(slug: string) {
  const s = SERVICOS.find((x) => x.slug === slug);
  if (!s) return null;
  const relacionados = SERVICOS.filter((x) => x.categoriaSlug === s.categoriaSlug && x.slug !== slug).slice(0, 4).map(toPublic);
  return { servico: toPublic(s), relacionados, publicos: PUBLICOS };
}
