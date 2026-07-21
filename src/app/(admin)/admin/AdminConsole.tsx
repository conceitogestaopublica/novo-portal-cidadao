"use client";

import { AlertCircle, FileSignature, Plus, Trash2, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCatalogo, AdminServico } from "@/shared/catalogo/catalogo-admin-repo";
import type { Ambiente, CategoriaSeed } from "@/shared/catalogo/catalogo-seed";
import { postJson, requestJsonOrError, requestNoContentOrError } from "@/shared/lib/client-api";
import { CatalogoIcon } from "@/shared/lib/icon-registry";

type Aba = "ambientes" | "categorias" | "servicos";

// Mapas com classes LITERAIS — o JIT do Tailwind não gera `bg-${cor}-100` dinâmico.
const COR_ICON: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-700",
  purple: "bg-purple-100 text-purple-700",
  teal: "bg-teal-100 text-teal-700",
};
const COR_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  slate: "bg-slate-500",
  purple: "bg-purple-500",
  teal: "bg-teal-500",
};
const CORES = Object.keys(COR_DOT);
const SISTEMAS = [
  { v: "tributario", label: "Tributário" },
  { v: "ged", label: "GED / Protocolo" },
  { v: "gpe2", label: "gpe2 / Servidor" },
];
const PUBLICOS = [
  { v: "cidadao", label: "Cidadão" },
  { v: "empresa", label: "Empresa" },
  { v: "servidor", label: "Servidor" },
];
const FLUXOS = [
  { v: "self_service_fiscal", label: "Autoatendimento fiscal (tributário)" },
  { v: "processo_ged", label: "Abre processo (GED)" },
  { v: "protocolo_gpe2", label: "Protocolo (gpe2)" },
];
const ACOES_FISCAIS = [
  { v: "debitos", label: "Consultar débitos" },
  { v: "segunda_via", label: "2ª via de guia" },
  { v: "certidao", label: "Certidão (CND/CPEN)" },
  { v: "parcelamento", label: "Parcelamento" },
  { v: "caixa_postal", label: "Caixa postal (DTE)" },
];

const inputCls = "mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm";
const labelCls = "text-xs font-semibold text-gray-600 uppercase tracking-wide";

export function AdminConsole({ inicial }: { inicial: AdminCatalogo }) {
  const router = useRouter();
  const [data, setData] = useState<AdminCatalogo>(inicial);
  const [aba, setAba] = useState<Aba>("servicos");
  const [editing, setEditing] = useState<{ tipo: Aba; item: Record<string, unknown> | null } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function recarregar() {
    setData(await requestJsonOrError<AdminCatalogo>("/api/admin/catalogo", { cache: "no-store" }));
  }

  async function enviar(url: string, body: unknown) {
    setBusy(true);
    setErro(null);
    try {
      await postJson(url, body, "Falha ao salvar");
      await recarregar();
      setEditing(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function excluir(url: string, aviso: string) {
    if (!window.confirm(aviso)) return;
    setBusy(true);
    setErro(null);
    try {
      await requestNoContentOrError(url, { method: "DELETE" }, "Falha ao excluir");
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/entrar");
    router.refresh();
  }

  const nomeAmbiente = (slug: string) => data.ambientes.find((a) => a.slug === slug)?.nome ?? slug;
  const nomeCategoria = (slug: string) => data.categorias.find((c) => c.slug === slug)?.nome ?? slug;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carta de Serviços</h1>
          <p className="text-sm text-gray-500">
            {data.ambientes.length} ambientes · {data.categorias.length} categorias · {data.servicos.length} serviços
          </p>
        </div>
        <button onClick={sair} className="text-xs text-gray-500 hover:text-red-600">
          <UserCheck className="size-4 mr-1" /> Sair
        </button>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          <AlertCircle className="size-4 mr-1.5" aria-hidden="true" />
          {erro}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {(["servicos", "categorias", "ambientes"] as Aba[]).map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              aba === t ? "border-slate-800 text-slate-900" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "servicos" ? "Serviços" : t === "categorias" ? "Categorias" : "Ambientes"}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setEditing({ tipo: aba, item: null })}
          className="px-4 py-2 my-1 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
        >
          <Plus className="size-4 mr-1.5" />
          Novo {aba === "servicos" ? "serviço" : aba === "categorias" ? "categoria" : "ambiente"}
        </button>
      </div>

      {aba === "ambientes" && (
        <Lista
          vazio="Nenhum ambiente."
          linhas={data.ambientes.map((a) => ({
            key: a.slug,
            icone: a.icone,
            cor: a.cor,
            titulo: a.nome,
            sub: `${SISTEMAS.find((s) => s.v === a.sistema)?.label ?? a.sistema}${a.disponivel ? "" : " · oculto"}`,
            onEdit: () => setEditing({ tipo: "ambientes", item: a as unknown as Record<string, unknown> }),
            onDel: () => excluir(`/api/admin/ambientes/${a.slug}`, `Excluir o ambiente "${a.nome}"?`),
          }))}
        />
      )}

      {aba === "categorias" && (
        <Lista
          vazio="Nenhuma categoria."
          linhas={data.categorias.map((c) => ({
            key: c.slug,
            icone: c.icone ?? "fas fa-folder",
            cor: c.cor ?? "slate",
            titulo: c.nome,
            sub: nomeAmbiente(c.ambienteSlug),
            onEdit: () => setEditing({ tipo: "categorias", item: c as unknown as Record<string, unknown> }),
            onDel: () => excluir(`/api/admin/categorias/${c.slug}`, `Excluir a categoria "${c.nome}"?`),
          }))}
        />
      )}

      {aba === "servicos" && (
        <Lista
          vazio="Nenhum serviço."
          linhas={data.servicos.map((s) => ({
            key: s.slug,
            icone: s.icone ?? "fas fa-file-lines",
            cor: s.categoria?.cor ?? "slate",
            titulo: s.titulo,
            sub: `${nomeCategoria(s.categoriaSlug)} · ${FLUXOS.find((f) => f.v === s.tipo_fluxo)?.label ?? s.tipo_fluxo ?? ""}`,
            badge: s.publicado ? undefined : "rascunho",
            onEdit: () => setEditing({ tipo: "servicos", item: s as unknown as Record<string, unknown> }),
            onDel: () => excluir(`/api/admin/servicos/${s.slug}`, `Excluir o serviço "${s.titulo}"?`),
          }))}
        />
      )}

      {editing?.tipo === "ambientes" && (
        <AmbienteForm item={editing.item as Ambiente | null} busy={busy} onCancel={() => setEditing(null)} onSave={(b) => enviar("/api/admin/ambientes", b)} />
      )}
      {editing?.tipo === "categorias" && (
        <CategoriaForm item={editing.item as CategoriaSeed | null} ambientes={data.ambientes} busy={busy} onCancel={() => setEditing(null)} onSave={(b) => enviar("/api/admin/categorias", b)} />
      )}
      {editing?.tipo === "servicos" && (
        <ServicoForm item={editing.item as AdminServico | null} categorias={data.categorias} busy={busy} onCancel={() => setEditing(null)} onSave={(b) => enviar("/api/admin/servicos", b)} />
      )}
    </div>
  );
}

/* ---------- Lista ---------- */

interface Linha {
  key: string;
  icone: string;
  cor: string;
  titulo: string;
  sub: string;
  badge?: string;
  onEdit: () => void;
  onDel: () => void;
}

function Lista({ linhas, vazio }: { linhas: Linha[]; vazio: string }) {
  if (!linhas.length) return <p className="text-sm text-gray-400 py-8 text-center">{vazio}</p>;
  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {linhas.map((l) => (
        <div key={l.key} className="flex items-center gap-3 px-4 py-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COR_ICON[l.cor] ?? COR_ICON.slate}`}>
            <CatalogoIcon nome={l.icone} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {l.titulo}
              {l.badge && <span className="ml-2 text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{l.badge}</span>}
            </p>
            <p className="text-xs text-gray-500 truncate">{l.sub}</p>
          </div>
          <button onClick={l.onEdit} className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900" title="Editar">
            <FileSignature className="size-4" aria-hidden="true" />
          </button>
          <button onClick={l.onDel} className="px-2 py-1 text-xs text-gray-400 hover:text-red-600" title="Excluir">
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */

function Modal({ titulo, children, onCancel }: { titulo: string; children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{titulo}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Acoes({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
        Cancelar
      </button>
      <button disabled={busy} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-60">
        {busy ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

/* ---------- Formulários ---------- */

function AmbienteForm({ item, busy, onCancel, onSave }: { item: Ambiente | null; busy: boolean; onCancel: () => void; onSave: (b: unknown) => void }) {
  const [f, setF] = useState({
    slug: item?.slug ?? "",
    nome: item?.nome ?? "",
    descricao: item?.descricao ?? "",
    icone: item?.icone ?? "fas fa-folder-open",
    cor: item?.cor ?? "blue",
    sistema: item?.sistema ?? "ged",
    disponivel: item?.disponivel ?? true,
  });
  return (
    <Modal titulo={item ? "Editar ambiente" : "Novo ambiente"} onCancel={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-4">
        <div>
          <label className={labelCls}>Nome *</label>
          <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Descrição</label>
          <textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <IconePicker valor={f.icone} onChange={(v) => setF({ ...f, icone: v })} />
          <CorPicker valor={f.cor} onChange={(v) => setF({ ...f, cor: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Sistema</label>
            <select value={f.sistema} onChange={(e) => setF({ ...f, sistema: e.target.value as Ambiente["sistema"] })} className={inputCls}>
              {SISTEMAS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 mt-6 text-sm text-gray-700">
            <input type="checkbox" checked={f.disponivel} onChange={(e) => setF({ ...f, disponivel: e.target.checked })} />
            Disponível (visível no portal)
          </label>
        </div>
        <Acoes busy={busy} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

function CategoriaForm({ item, ambientes, busy, onCancel, onSave }: { item: CategoriaSeed | null; ambientes: Ambiente[]; busy: boolean; onCancel: () => void; onSave: (b: unknown) => void }) {
  const [f, setF] = useState({
    id: item?.id,
    slug: item?.slug ?? "",
    ambienteSlug: item?.ambienteSlug ?? ambientes[0]?.slug ?? "",
    nome: item?.nome ?? "",
    descricao: item?.descricao ?? "",
    icone: item?.icone ?? "fas fa-folder",
    cor: item?.cor ?? "blue",
  });
  return (
    <Modal titulo={item ? "Editar categoria" : "Nova categoria"} onCancel={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome *</label>
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ambiente *</label>
            <select value={f.ambienteSlug} onChange={(e) => setF({ ...f, ambienteSlug: e.target.value })} className={inputCls}>
              {ambientes.map((a) => <option key={a.slug} value={a.slug}>{a.nome}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Descrição</label>
          <textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <IconePicker valor={f.icone ?? ""} onChange={(v) => setF({ ...f, icone: v })} />
          <CorPicker valor={f.cor ?? "blue"} onChange={(v) => setF({ ...f, cor: v })} />
        </div>
        <Acoes busy={busy} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

function ServicoForm({ item, categorias, busy, onCancel, onSave }: { item: AdminServico | null; categorias: CategoriaSeed[]; busy: boolean; onCancel: () => void; onSave: (b: unknown) => void }) {
  const [f, setF] = useState({
    id: item?.id,
    slug: item?.slug ?? "",
    categoriaSlug: item?.categoriaSlug ?? categorias[0]?.slug ?? "",
    titulo: item?.titulo ?? "",
    publico_alvo: item?.publico_alvo ?? "cidadao",
    tipo_fluxo: item?.tipo_fluxo ?? "processo_ged",
    fiscal_acao: item?.fiscal_acao ?? "debitos",
    descricao_curta: item?.descricao_curta ?? "",
    descricao_completa: item?.descricao_completa ?? "",
    orgao_responsavel: item?.orgao_responsavel ?? "",
    prazo_entrega: item?.prazo_entrega ?? "Imediato",
    custo: item?.custo ?? "Gratuito",
    legislacao: item?.legislacao ?? "",
    palavras: (item?.palavras_chave ?? []).join(", "),
    icone: item?.icone ?? "fas fa-file-lines",
    publicado: item?.publicado ?? true,
    permite_anonimo: item?.permite_anonimo ?? false,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...f,
      palavras_chave: f.palavras.split(",").map((s) => s.trim()).filter(Boolean),
      fiscal_acao: f.tipo_fluxo === "self_service_fiscal" ? f.fiscal_acao : null,
    });
  }

  return (
    <Modal titulo={item ? "Editar serviço" : "Novo serviço"} onCancel={onCancel}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Título *</label>
          <input required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Categoria *</label>
            <select value={f.categoriaSlug} onChange={(e) => setF({ ...f, categoriaSlug: e.target.value })} className={inputCls}>
              {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Público-alvo</label>
            <select value={f.publico_alvo} onChange={(e) => setF({ ...f, publico_alvo: e.target.value as AdminServico["publico_alvo"] })} className={inputCls}>
              {PUBLICOS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo de fluxo</label>
            <select value={f.tipo_fluxo} onChange={(e) => setF({ ...f, tipo_fluxo: e.target.value as NonNullable<AdminServico["tipo_fluxo"]> })} className={inputCls}>
              {FLUXOS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
            </select>
          </div>
          {f.tipo_fluxo === "self_service_fiscal" && (
            <div>
              <label className={labelCls}>Ação fiscal</label>
              <select value={f.fiscal_acao ?? "debitos"} onChange={(e) => setF({ ...f, fiscal_acao: e.target.value as NonNullable<AdminServico["fiscal_acao"]> })} className={inputCls}>
                {ACOES_FISCAIS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Descrição curta</label>
          <input value={f.descricao_curta ?? ""} onChange={(e) => setF({ ...f, descricao_curta: e.target.value })} className={inputCls} placeholder="Uma linha que aparece no card do serviço" />
        </div>
        <div>
          <label className={labelCls}>Descrição completa</label>
          <textarea value={f.descricao_completa ?? ""} onChange={(e) => setF({ ...f, descricao_completa: e.target.value })} rows={3} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Órgão responsável</label>
            <input value={f.orgao_responsavel ?? ""} onChange={(e) => setF({ ...f, orgao_responsavel: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prazo de entrega</label>
            <input value={f.prazo_entrega ?? ""} onChange={(e) => setF({ ...f, prazo_entrega: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Custo</label>
            <input value={f.custo ?? ""} onChange={(e) => setF({ ...f, custo: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Legislação</label>
            <input value={f.legislacao ?? ""} onChange={(e) => setF({ ...f, legislacao: e.target.value })} className={inputCls} placeholder="Ex.: Lei 13.460/2017" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Palavras-chave (separadas por vírgula)</label>
          <input value={f.palavras} onChange={(e) => setF({ ...f, palavras: e.target.value })} className={inputCls} placeholder="certidão, cnd, negativa" />
        </div>
        <IconePicker valor={f.icone ?? ""} onChange={(v) => setF({ ...f, icone: v })} />
        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={f.publicado} onChange={(e) => setF({ ...f, publicado: e.target.checked })} />
            Publicado (visível no portal)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={f.permite_anonimo} onChange={(e) => setF({ ...f, permite_anonimo: e.target.checked })} />
            Permite solicitação anônima
          </label>
        </div>
        <Acoes busy={busy} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

/* ---------- Pickers ---------- */

function CorPicker({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>Cor</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {CORES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full ${COR_DOT[c]} ${valor === c ? "ring-2 ring-offset-2 ring-slate-700" : ""}`}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function IconePicker({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>Ícone (classe FontAwesome)</label>
      <div className="mt-1 flex items-center gap-2">
        <span className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
          <CatalogoIcon nome={valor} />
        </span>
        <input value={valor} onChange={(e) => onChange(e.target.value)} className={inputCls.replace("mt-1 ", "")} placeholder="fas fa-file-invoice" />
      </div>
    </div>
  );
}
