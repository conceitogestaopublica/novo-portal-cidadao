"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileSignature, Plus, Trash2, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminCatalogo, AdminServico } from "@/shared/catalogo/catalogo-admin-repo";
import type { Ambiente, CategoriaSeed } from "@/shared/catalogo/catalogo-seed";
import { CatalogoIcon } from "@/shared/lib/icon-registry";
import { useCatalogoAdmin, useExcluirCatalogo, useSalvarCatalogo } from "../hooks/use-catalogo-admin";
import {
  ambienteSchema,
  categoriaSchema,
  servicoFormSchema,
  type AmbienteFormInput,
  type AmbienteOutput,
  type CategoriaFormInput,
  type CategoriaOutput,
  type ServicoFormInput,
  type ServicoFormOutput,
} from "../schemas/catalogo-admin.schema";

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
  { v: "nfse", label: "NFS-e (emitir/consultar)" },
  { v: "dms", label: "DMS (declaração mensal)" },
  { v: "prestei", label: "Prestei serviço aqui (outro município)" },
];

const inputCls = "mt-1 w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export function AdminConsole({ inicial }: { inicial: AdminCatalogo }) {
  const router = useRouter();
  const { data } = useCatalogoAdmin(inicial);
  const [aba, setAba] = useState<Aba>("servicos");
  const [editing, setEditing] = useState<{ tipo: Aba; item: Record<string, unknown> | null } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const salvarMutation = useSalvarCatalogo();
  const excluirMutation = useExcluirCatalogo();
  const busy = salvarMutation.isPending || excluirMutation.isPending;

  async function enviar(url: string, body: unknown) {
    setErro(null);
    try {
      await salvarMutation.mutateAsync({ url, body });
      setEditing(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    }
  }

  async function excluir(url: string, aviso: string) {
    if (!window.confirm(aviso)) return;
    setErro(null);
    try {
      await excluirMutation.mutateAsync(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
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
          <h1 className="text-2xl font-bold text-foreground">Carta de Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {data.ambientes.length} ambientes · {data.categorias.length} categorias · {data.servicos.length} serviços
          </p>
        </div>
        <button onClick={sair} className="text-xs text-muted-foreground hover:text-red-600">
          <UserCheck className="size-4 mr-1" /> Sair
        </button>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          <AlertCircle className="size-4 mr-1.5" aria-hidden="true" />
          {erro}
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(["servicos", "categorias", "ambientes"] as Aba[]).map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              aba === t ? "border-slate-800 text-slate-900" : "border-transparent text-muted-foreground hover:text-foreground"
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
  if (!linhas.length) return <p className="text-sm text-muted-foreground py-8 text-center">{vazio}</p>;
  return (
    <div className="bg-card rounded-xl border border-border divide-y divide-border">
      {linhas.map((l) => (
        <div key={l.key} className="flex items-center gap-3 px-4 py-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COR_ICON[l.cor] ?? COR_ICON.slate}`}>
            <CatalogoIcon nome={l.icone} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {l.titulo}
              {l.badge && <span className="ml-2 text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{l.badge}</span>}
            </p>
            <p className="text-xs text-muted-foreground truncate">{l.sub}</p>
          </div>
          <button onClick={l.onEdit} className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900" title="Editar">
            <FileSignature className="size-4" aria-hidden="true" />
          </button>
          <button onClick={l.onDel} className="px-2 py-1 text-xs text-muted-foreground hover:text-red-600" title="Excluir">
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
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-bold text-foreground">{titulo}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
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
      <Button type="button" variant="ghost" onClick={onCancel} className="px-4 py-2 h-auto rounded-lg text-sm text-muted-foreground hover:bg-muted">
        Cancelar
      </Button>
      <Button type="submit" disabled={busy} className="px-4 py-2 h-auto rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-60">
        {busy ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}

/* ---------- Formulários ---------- */

function AmbienteForm({ item, busy, onCancel, onSave }: { item: Ambiente | null; busy: boolean; onCancel: () => void; onSave: (b: AmbienteOutput) => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AmbienteFormInput, unknown, AmbienteOutput>({
    resolver: zodResolver(ambienteSchema),
    defaultValues: {
      slug: item?.slug ?? "",
      nome: item?.nome ?? "",
      descricao: item?.descricao ?? "",
      icone: item?.icone ?? "fas fa-folder-open",
      cor: item?.cor ?? "blue",
      sistema: item?.sistema ?? "ged",
      disponivel: item?.disponivel ?? true,
    },
  });
  return (
    <Modal titulo={item ? "Editar ambiente" : "Novo ambiente"} onCancel={onCancel}>
      <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
        <div>
          <Label className={labelCls}>Nome *</Label>
          <Input className={inputCls} {...register("nome")} />
          {errors.nome && <p className="text-xs text-destructive mt-1" role="alert">{errors.nome.message}</p>}
        </div>
        <div>
          <Label className={labelCls}>Descrição</Label>
          <textarea rows={2} className={inputCls} {...register("descricao")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="icone" render={({ field }) => <IconePicker valor={field.value ?? "fas fa-folder-open"} onChange={field.onChange} />} />
          <Controller control={control} name="cor" render={({ field }) => <CorPicker valor={field.value ?? "blue"} onChange={field.onChange} />} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Sistema</Label>
            <select className={inputCls} {...register("sistema")}>
              {SISTEMAS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 mt-6 text-sm text-foreground">
            <input type="checkbox" {...register("disponivel")} />
            Disponível (visível no portal)
          </label>
        </div>
        <Acoes busy={busy} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

function CategoriaForm({ item, ambientes, busy, onCancel, onSave }: { item: CategoriaSeed | null; ambientes: Ambiente[]; busy: boolean; onCancel: () => void; onSave: (b: CategoriaOutput) => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoriaFormInput, unknown, CategoriaOutput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      id: item?.id,
      slug: item?.slug ?? "",
      ambienteSlug: item?.ambienteSlug ?? ambientes[0]?.slug ?? "",
      nome: item?.nome ?? "",
      descricao: item?.descricao ?? "",
      icone: item?.icone ?? "fas fa-folder",
      cor: item?.cor ?? "blue",
    },
  });
  return (
    <Modal titulo={item ? "Editar categoria" : "Nova categoria"} onCancel={onCancel}>
      <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Nome *</Label>
            <Input className={inputCls} {...register("nome")} />
            {errors.nome && <p className="text-xs text-destructive mt-1" role="alert">{errors.nome.message}</p>}
          </div>
          <div>
            <Label className={labelCls}>Ambiente *</Label>
            <select className={inputCls} {...register("ambienteSlug")}>
              {ambientes.map((a) => <option key={a.slug} value={a.slug}>{a.nome}</option>)}
            </select>
            {errors.ambienteSlug && <p className="text-xs text-destructive mt-1" role="alert">{errors.ambienteSlug.message}</p>}
          </div>
        </div>
        <div>
          <Label className={labelCls}>Descrição</Label>
          <textarea rows={2} className={inputCls} {...register("descricao")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller control={control} name="icone" render={({ field }) => <IconePicker valor={field.value ?? ""} onChange={field.onChange} />} />
          <Controller control={control} name="cor" render={({ field }) => <CorPicker valor={field.value ?? "blue"} onChange={field.onChange} />} />
        </div>
        <Acoes busy={busy} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

function ServicoForm({ item, categorias, busy, onCancel, onSave }: { item: AdminServico | null; categorias: CategoriaSeed[]; busy: boolean; onCancel: () => void; onSave: (b: unknown) => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ServicoFormInput, unknown, ServicoFormOutput>({
    resolver: zodResolver(servicoFormSchema),
    defaultValues: {
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
    },
  });
  const tipoFluxo = useWatch({ control, name: "tipo_fluxo" });

  function submit(f: ServicoFormOutput) {
    const { palavras, ...resto } = f;
    onSave({
      ...resto,
      palavras_chave: palavras.split(",").map((s) => s.trim()).filter(Boolean),
      fiscal_acao: resto.tipo_fluxo === "self_service_fiscal" ? resto.fiscal_acao : null,
    });
  }

  return (
    <Modal titulo={item ? "Editar serviço" : "Novo serviço"} onCancel={onCancel}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <div>
          <Label className={labelCls}>Título *</Label>
          <Input className={inputCls} {...register("titulo")} />
          {errors.titulo && <p className="text-xs text-destructive mt-1" role="alert">{errors.titulo.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Categoria *</Label>
            <select className={inputCls} {...register("categoriaSlug")}>
              {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
            </select>
            {errors.categoriaSlug && <p className="text-xs text-destructive mt-1" role="alert">{errors.categoriaSlug.message}</p>}
          </div>
          <div>
            <Label className={labelCls}>Público-alvo</Label>
            <select className={inputCls} {...register("publico_alvo")}>
              {PUBLICOS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Tipo de fluxo</Label>
            <select className={inputCls} {...register("tipo_fluxo")}>
              {FLUXOS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
            </select>
          </div>
          {tipoFluxo === "self_service_fiscal" && (
            <div>
              <Label className={labelCls}>Ação fiscal</Label>
              <select className={inputCls} {...register("fiscal_acao")}>
                {ACOES_FISCAIS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <Label className={labelCls}>Descrição curta</Label>
          <Input className={inputCls} placeholder="Uma linha que aparece no card do serviço" {...register("descricao_curta")} />
        </div>
        <div>
          <Label className={labelCls}>Descrição completa</Label>
          <textarea rows={3} className={inputCls} {...register("descricao_completa")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Órgão responsável</Label>
            <Input className={inputCls} {...register("orgao_responsavel")} />
          </div>
          <div>
            <Label className={labelCls}>Prazo de entrega</Label>
            <Input className={inputCls} {...register("prazo_entrega")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Custo</Label>
            <Input className={inputCls} {...register("custo")} />
          </div>
          <div>
            <Label className={labelCls}>Legislação</Label>
            <Input className={inputCls} placeholder="Ex.: Lei 13.460/2017" {...register("legislacao")} />
          </div>
        </div>
        <div>
          <Label className={labelCls}>Palavras-chave (separadas por vírgula)</Label>
          <Input className={inputCls} placeholder="certidão, cnd, negativa" {...register("palavras")} />
        </div>
        <Controller control={control} name="icone" render={({ field }) => <IconePicker valor={field.value ?? ""} onChange={field.onChange} />} />
        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" {...register("publicado")} />
            Publicado (visível no portal)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" {...register("permite_anonimo")} />
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
        <span className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground shrink-0">
          <CatalogoIcon nome={valor} />
        </span>
        <input value={valor} onChange={(e) => onChange(e.target.value)} className={inputCls.replace("mt-1 ", "")} placeholder="fas fa-file-invoice" />
      </div>
    </div>
  );
}
