"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/shared/lib/client-api";
import { responderSolicitacaoSchema, type ResponderSolicitacaoInput } from "@/modules/solicitacoes/schemas/solicitacoes.schema";

/** Formulário do cidadão para responder a uma exigência ("pedir mais informações"). */
export function ResponderForm({ id }: { id: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResponderSolicitacaoInput>({
    resolver: zodResolver(responderSolicitacaoSchema),
    defaultValues: { texto: "" },
  });
  const texto = useWatch({ control, name: "texto" });

  async function onSubmit(data: ResponderSolicitacaoInput) {
    try {
      await postJson(`/api/solicitacoes/${id}/responder`, data, "Não foi possível enviar sua resposta.");
      reset();
      router.refresh();
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Não foi possível enviar sua resposta." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3" noValidate>
      <textarea
        rows={4}
        placeholder="Escreva aqui as informações solicitadas…"
        className="w-full px-3 py-2 text-sm rounded-lg border border-violet-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        {...register("texto")}
      />
      {(errors.texto || errors.root) && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {errors.texto?.message ?? errors.root?.message}
        </p>
      )}
      <div className="flex justify-end mt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !texto.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 h-auto text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50"
        >
          <Send className="size-4" />
          {isSubmitting ? "Enviando…" : "Enviar resposta"}
        </Button>
      </div>
    </form>
  );
}
