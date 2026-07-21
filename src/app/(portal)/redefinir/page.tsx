"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestJsonOrError, postJson } from "@/shared/lib/client-api";
import { redefinirFormSchema, type RedefinirFormInput } from "@/modules/auth/schemas/auth.schema";

function RedefinirForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [pronto, setPronto] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirFormInput>({
    resolver: zodResolver(redefinirFormSchema),
    defaultValues: { token, senha: "", senha2: "" },
  });

  // Confere o link antes de mostrar o formulário: pedir a senha nova e só
  // depois dizer "link expirado" seria fazer a pessoa digitar à toa.
  const checagem = useQuery({
    queryKey: ["redefinir", token],
    queryFn: () => requestJsonOrError<{ valido?: boolean }>(`/api/auth/redefinir?token=${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

  const valido = !token ? false : checagem.isLoading ? null : (checagem.data?.valido ?? false);

  async function onSubmit(data: RedefinirFormInput) {
    try {
      await postJson("/api/auth/redefinir", { token, senha: data.senha }, "Falha ao redefinir");
      setPronto(true);
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  const inputCls = "w-full px-3 py-2.5 h-auto rounded-xl border-gray-300 text-sm focus-visible:ring-blue-500";
  const card = "max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8";

  if (pronto) {
    return (
      <div className={card}>
        <CheckCircle2 className="size-8 text-green-600 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Senha alterada</h1>
        <p className="text-sm text-gray-600 mb-5">Pronto. Entre com sua nova senha.</p>
        <Button onClick={() => router.push("/entrar")} className="w-full px-5 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
          Entrar
        </Button>
      </div>
    );
  }

  if (valido === null) {
    return (
      <div className={card}>
        <p className="text-sm text-gray-500">Conferindo o link…</p>
      </div>
    );
  }

  if (!valido) {
    return (
      <div className={card}>
        <Unlink className="size-8 text-gray-300 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h1>
        <p className="text-sm text-gray-600 mb-5">
          Este link expirou ou já foi usado. Peça a recuperação de novo — leva um minuto.
        </p>
        <Link href="/recuperar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <h1 className="text-xl font-bold text-gray-800">Nova senha</h1>
      <p className="text-sm text-gray-500 mb-5">Escolha uma senha para entrar no portal.</p>

      {errors.root && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2" role="alert">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Senha</Label>
          <Input autoFocus type="password" placeholder="mín. 6" className={inputCls} {...register("senha")} />
          {errors.senha && (
            <p className="text-xs text-destructive mt-1" role="alert">
              {errors.senha.message}
            </p>
          )}
        </div>
        <div>
          <Label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Confirmar</Label>
          <Input type="password" className={inputCls} {...register("senha2")} />
          {errors.senha2 && (
            <p className="text-xs text-destructive mt-1" role="alert">
              {errors.senha2.message}
            </p>
          )}
        </div>
        <Button disabled={isSubmitting} className="w-full px-5 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}

export default function RedefinirPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-sm text-gray-500">Carregando…</p>
        </div>
      }
    >
      <RedefinirForm />
    </Suspense>
  );
}
