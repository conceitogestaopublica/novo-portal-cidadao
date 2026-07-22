"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/shared/lib/http-client";
import { criarSolicitacaoSchema, type CriarSolicitacaoInput } from "@/modules/solicitacoes/schemas/solicitacoes.schema";
import { useCriarSolicitacao } from "../hooks/use-solicitar";

export function SolicitarForm({ slug, nome }: { slug: string; nome: string }) {
  const router = useRouter();
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const { mutateAsync, isPending } = useCriarSolicitacao();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CriarSolicitacaoInput>({
    resolver: zodResolver(criarSolicitacaoSchema),
    defaultValues: { servicoSlug: slug, contato: "", mensagem: "" },
  });

  async function onSubmit(data: CriarSolicitacaoInput) {
    try {
      const resposta = await mutateAsync(data);
      setProtocolo(resposta?.solicitacao?.protocolo ?? "—");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push("/entrar");
        return;
      }
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  if (protocolo) {
    return (
      <div className="bg-card rounded-2xl border border-green-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Solicitação registrada!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Protocolo <strong className="text-foreground">{protocolo}</strong>. Acompanhe pelo menu “Minhas Solicitações”.
        </p>
        <div className="flex gap-2 justify-center mt-5">
          <Link href="/minhas-solicitacoes" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
            Minhas solicitações
          </Link>
          <Link href="/" className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted/50">
            Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border p-6 space-y-4" noValidate>
      {errors.root && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-start gap-1.5" role="alert">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          {errors.root.message}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Solicitante: <strong className="text-foreground">{nome}</strong>
      </p>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato (e-mail ou telefone)</Label>
        <Input placeholder="para retorno" className={inputCls} {...register("contato")} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descreva sua solicitação</Label>
        <textarea
          rows={5}
          placeholder="Detalhe o que você precisa…"
          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("mensagem")}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full px-5 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
        <Send className="size-4" />
        {isPending ? "Enviando…" : "Enviar solicitação"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">Sua solicitação gera um protocolo e será encaminhada para tramitação.</p>
    </form>
  );
}

const inputCls = "mt-1 w-full px-3 py-2.5 h-auto rounded-xl border-border text-sm focus-visible:ring-blue-500";
