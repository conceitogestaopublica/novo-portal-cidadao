"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { MailCheck, TriangleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/shared/lib/client-api";
import { recuperarSchema, type RecuperarInput } from "@/modules/auth/schemas/auth.schema";

/**
 * Pedir o link de recuperação de senha. Vale para qualquer usuário do portal.
 *
 * A resposta é sempre a mesma, exista a conta ou não — quem sonda documentos não
 * descobre quais têm conta aqui.
 */
export function RecuperarForm() {
  const [enviado, setEnviado] = useState<{
    message: string;
    devLink?: string;
    envioConfigurado?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarInput>({ resolver: zodResolver(recuperarSchema), defaultValues: { documento: "" } });
  const documento = useWatch({ control, name: "documento" });

  async function onSubmit(data: RecuperarInput) {
    try {
      const resposta = await postJson<{ message: string; devLink?: string; envioConfigurado?: boolean }>(
        "/api/auth/recuperar",
        { documento: data.documento.replace(/\D/g, "") },
      );
      setEnviado(resposta);
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  if (enviado) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <MailCheck className="size-8 text-blue-600 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pedido recebido</h1>
        <p className="text-sm text-gray-600">{enviado.message}</p>
        <p className="text-xs text-gray-500 mt-2">O link vale por 1 hora e só pode ser usado uma vez.</p>

        {enviado.envioConfigurado === false && (
          <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
            <TriangleAlert className="size-4 mr-1.5" />
            O envio de e-mail ainda não está configurado neste município. Se você
            não receber, procure a Prefeitura.
          </p>
        )}

        {enviado.devLink && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-[11px] text-gray-500 mb-1">Ambiente de desenvolvimento — link gerado:</p>
            <a href={enviado.devLink} className="text-xs text-blue-600 break-all hover:underline">
              {enviado.devLink}
            </a>
          </div>
        )}

        <Link href="/entrar" className="mt-6 inline-block text-sm text-blue-600 font-semibold hover:text-blue-700">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
      <h1 className="text-xl font-bold text-gray-800">Esqueci minha senha</h1>
      <p className="text-sm text-gray-500 mb-5">
        Informe seu CPF ou CNPJ. Enviaremos um link para o e-mail do seu cadastro.
      </p>

      {errors.root && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2" role="alert">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">CPF ou CNPJ</Label>
          <Input autoFocus placeholder="000.000.000-00" className={inputCls} {...register("documento")} />
          {errors.documento && (
            <p className="text-xs text-destructive mt-1" role="alert">
              {errors.documento.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting || documento.replace(/\D/g, "").length < 11} className={btnCls}>
          {isSubmitting ? "Enviando…" : "Enviar link"}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-4">
        Lembrou?{" "}
        <Link href="/entrar" className="text-blue-600 font-semibold hover:text-blue-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 h-auto rounded-xl border-gray-300 text-sm focus-visible:ring-blue-500";
const btnCls = "w-full px-5 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";
