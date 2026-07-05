import type { Categoria, Servico } from "@/shared/types/portal";

/**
 * Dados semente da Carta de Serviços. Fonte inicial do catálogo (usada para
 * popular o banco do portal na 1ª carga e como fallback). A carga real virá do
 * GED (sync via `/api/portal/catalogo`) para as tabelas `portal_*`.
 */

export interface ServicoSeed extends Servico {
  categoriaSlug: string;
}

/** Ambiente = grande área do portal (mapeia um sistema/domínio). */
export interface Ambiente {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  sistema: "tributario" | "ged" | "gpe2";
  disponivel: boolean;
}

export interface CategoriaSeed extends Categoria {
  ambienteSlug: string;
}

export const PUBLICOS: Record<string, string> = { cidadao: "Cidadão", empresa: "Empresa", servidor: "Servidor" };

export const AMBIENTES_SEED: Ambiente[] = [
  { slug: "atendimento", nome: "Atendimento ao Contribuinte", descricao: "Débitos, 2ª via de guias, certidões, parcelamento, IPTU, ISS e caixa postal (DTE).", icone: "fas fa-hand-holding-dollar", cor: "blue", sistema: "tributario", disponivel: true },
  { slug: "protocolo", nome: "Protocolo e Ouvidoria", descricao: "Abra requerimentos, protocolos e manifestações de ouvidoria e acompanhe a tramitação.", icone: "fas fa-folder-open", cor: "indigo", sistema: "ged", disponivel: true },
  { slug: "servidor", nome: "Servidor Público", descricao: "Contracheque, informe de rendimentos e serviços do servidor.", icone: "fas fa-id-badge", cor: "green", sistema: "gpe2", disponivel: false },
  { slug: "transparencia", nome: "Transparência", descricao: "Consultas públicas de receitas, despesas e contratações.", icone: "fas fa-chart-pie", cor: "amber", sistema: "gpe2", disponivel: false },
];

export const CATEGORIAS_SEED: CategoriaSeed[] = [
  { id: "tributos", ambienteSlug: "atendimento", nome: "Tributos e Débitos", slug: "tributos", icone: "fas fa-file-invoice-dollar", cor: "blue", descricao: "Consulte débitos, emita 2ª via de guias, certidões e parcele online." },
  { id: "imoveis", ambienteSlug: "atendimento", nome: "Imóveis (IPTU)", slug: "imoveis", icone: "fas fa-home", cor: "green", descricao: "IPTU, valor venal, situação cadastral e certidões do imóvel." },
  { id: "empresas", ambienteSlug: "atendimento", nome: "Empresas (ISS)", slug: "empresas", icone: "fas fa-store", cor: "amber", descricao: "NFS-e, DMS, ISS e serviços do cadastro econômico." },
  { id: "cidade", ambienteSlug: "protocolo", nome: "Requerimentos e Ouvidoria", slug: "cidade", icone: "fas fa-city", cor: "indigo", descricao: "Solicitações, reclamações, denúncias e serviços gerais ao cidadão." },
];

export const SERVICOS_SEED: ServicoSeed[] = [
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
