"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FlaskConical, UserLock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginSenhaSchema,
  loginStartSchema,
  loginVerifySchema,
  type LoginSenhaInput,
  type LoginStartInput,
  type LoginVerifyInput,
} from "@/modules/auth/schemas/auth.schema";
import { useLoginSenha, useLoginStart, useLoginVerify } from "../hooks/use-login";

export function EntrarForm() {
  const router = useRouter();
  const [modo, setModo] = useState<"senha" | "otp">("senha");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [canal, setCanal] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { mutateAsync: enviarLoginSenha } = useLoginSenha();
  const { mutateAsync: enviarLoginStart } = useLoginStart();
  const { mutateAsync: enviarLoginVerify } = useLoginVerify();

  const formSenha = useForm<LoginSenhaInput>({
    resolver: zodResolver(loginSenhaSchema),
    defaultValues: { documento: "", senha: "" },
  });

  const formStart = useForm<LoginStartInput>({
    resolver: zodResolver(loginStartSchema),
    defaultValues: { documento: "" },
  });

  const formVerify = useForm<LoginVerifyInput>({
    resolver: zodResolver(loginVerifySchema),
    defaultValues: { challengeId: "", otp: "" },
  });

  async function entrarSenha(data: LoginSenhaInput) {
    try {
      await enviarLoginSenha({ documento: data.documento.replace(/\D/g, ""), senha: data.senha });
      router.push("/fiscal");
      router.refresh();
    } catch (e) {
      formSenha.setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  async function iniciarOtp(data: LoginStartInput) {
    try {
      const documento = data.documento.replace(/\D/g, "");
      const d = await enviarLoginStart({ documento });
      if (d.encontrado === false || !d.challengeId) {
        formStart.setError("root", { message: "Documento não encontrado neste município." });
        return;
      }
      setChallengeId(d.challengeId);
      setCanal(d.canalMascarado ?? null);
      setDevOtp(d.devOtp ?? null);
      formVerify.setValue("challengeId", d.challengeId);
    } catch (e) {
      formStart.setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  async function verificarOtp(data: LoginVerifyInput) {
    try {
      await enviarLoginVerify({ challengeId: data.challengeId, otp: data.otp.trim() });
      router.push("/fiscal");
      router.refresh();
    } catch (e) {
      formVerify.setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  function trocarModo(novo: "senha" | "otp") {
    setModo(novo);
    formSenha.clearErrors("root");
    formStart.clearErrors("root");
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <UserLock className="text-white size-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Entrar no Atendimento</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse seus débitos, guias e certidões.</p>
        </div>

        {modo === "senha" ? (
          <form onSubmit={formSenha.handleSubmit(entrarSenha)} className="space-y-4" noValidate>
            <Erro mensagem={formSenha.formState.errors.root?.message} />
            <Campo label="CPF ou CNPJ" erro={formSenha.formState.errors.documento?.message}>
              <Input autoFocus placeholder="000.000.000-00" className={inputCls} {...formSenha.register("documento")} />
            </Campo>
            <Campo label="Senha" erro={formSenha.formState.errors.senha?.message}>
              <Input type="password" placeholder="••••••" className={inputCls} {...formSenha.register("senha")} />
            </Campo>
            <Button type="submit" disabled={formSenha.formState.isSubmitting} className={btnCls}>
              {formSenha.formState.isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
            <div className="flex items-center justify-between text-xs pt-1">
              <Link href="/cadastrar" className="text-blue-600 font-semibold hover:text-blue-700">
                Criar conta
              </Link>
              <button type="button" onClick={() => trocarModo("otp")} className="text-muted-foreground hover:text-gray-700">
                Entrar com código
              </button>
            </div>
            <p className="text-center text-xs pt-1">
              <Link href="/recuperar" className="text-muted-foreground hover:text-gray-700">
                Esqueci minha senha
              </Link>
            </p>
          </form>
        ) : !challengeId ? (
          <form onSubmit={formStart.handleSubmit(iniciarOtp)} className="space-y-4" noValidate>
            <Erro mensagem={formStart.formState.errors.root?.message} />
            <p className="text-xs text-muted-foreground -mt-2">Acesso rápido: enviamos um código para o seu contato cadastrado.</p>
            <Campo label="CPF ou CNPJ" erro={formStart.formState.errors.documento?.message}>
              <Input autoFocus placeholder="000.000.000-00" className={inputCls} {...formStart.register("documento")} />
            </Campo>
            <Button type="submit" disabled={formStart.formState.isSubmitting} className={btnCls}>
              {formStart.formState.isSubmitting ? "Enviando..." : "Enviar código"}
            </Button>
            <button type="button" onClick={() => trocarModo("senha")} className="w-full text-xs text-muted-foreground hover:text-gray-700">
              Entrar com senha
            </button>
          </form>
        ) : (
          <form onSubmit={formVerify.handleSubmit(verificarOtp)} className="space-y-4" noValidate>
            <Erro mensagem={formVerify.formState.errors.root?.message} />
            {canal && (
              <p className="text-xs text-muted-foreground text-center">
                Código enviado para <strong>{canal}</strong>.
              </p>
            )}
            {devOtp && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 text-center flex items-center justify-center gap-1">
                <FlaskConical className="size-4" aria-hidden="true" /> Dev: código{" "}
                <strong className="font-mono tracking-widest">{devOtp}</strong>
              </div>
            )}
            <Campo label="Código de verificação" erro={formVerify.formState.errors.otp?.message}>
              <Input
                autoFocus
                inputMode="numeric"
                placeholder="000000"
                className={`${inputCls} text-center text-lg font-mono tracking-[0.3em]`}
                {...formVerify.register("otp")}
              />
            </Campo>
            <Button type="submit" disabled={formVerify.formState.isSubmitting} className={btnCls}>
              {formVerify.formState.isSubmitting ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground mt-4">Em breve: Login Único gov.br.</p>
    </div>
  );
}

const inputCls = "mt-1 w-full px-4 py-3 h-auto rounded-xl border-border focus-visible:ring-blue-500 text-sm";
const btnCls = "w-full px-4 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
      {erro && (
        <p className="text-xs text-destructive mt-1" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <div className="mb-1 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-start gap-1.5" role="alert">
      <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      {mensagem}
    </div>
  );
}
