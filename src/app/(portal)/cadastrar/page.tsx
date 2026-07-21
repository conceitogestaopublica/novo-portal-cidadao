"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/shared/lib/client-api";
import { cadastroFormSchema, type CadastroFormInput } from "@/modules/auth/schemas/auth.schema";

export default function CadastrarPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormInput>({
    resolver: zodResolver(cadastroFormSchema),
    defaultValues: { documento: "", nome: "", email: "", senha: "", senha2: "", prestadorExterno: false },
  });
  const prestadorExterno = useWatch({ control, name: "prestadorExterno" });

  async function onSubmit(data: CadastroFormInput) {
    try {
      await postJson("/api/auth/cadastrar", {
        documento: data.documento.replace(/\D/g, ""),
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        prestadorExterno: data.prestadorExterno,
      });
      router.push("/fiscal");
      router.refresh();
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <UserPlus className="text-white size-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se para acessar o Atendimento ao Contribuinte.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 flex items-start gap-1.5" role="alert">
            <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Campo label="CPF ou CNPJ" erro={errors.documento?.message}>
            <Input autoFocus placeholder="000.000.000-00" className={inputCls} {...register("documento")} />
          </Campo>
          <Campo label="Nome completo" erro={errors.nome?.message}>
            <Input className={inputCls} {...register("nome")} />
          </Campo>
          <Campo label="E-mail (opcional)" erro={errors.email?.message}>
            <Input type="email" className={inputCls} {...register("email")} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Senha" erro={errors.senha?.message}>
              <Input type="password" placeholder="mín. 6" className={inputCls} {...register("senha")} />
            </Campo>
            <Campo label="Confirmar" erro={errors.senha2?.message}>
              <Input type="password" className={inputCls} {...register("senha2")} />
            </Campo>
          </div>
          <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 rounded border-gray-300" {...register("prestadorExterno")} />
            <span className="text-sm text-gray-700">
              <strong>Sou de outro município</strong> e prestei serviço aqui
              <span className="block text-xs text-gray-500 mt-0.5">
                Marque para declarar o serviço que você prestou no município e
                pagar o ISS. Seu cadastro é criado agora.
              </span>
            </span>
          </label>
          <Button disabled={isSubmitting} className={btnCls}>
            {isSubmitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-blue-600 font-semibold hover:text-blue-700">
            Entrar
          </Link>
        </p>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          {prestadorExterno
            ? "Seu CPF/CNPJ é validado e passa a constar no cadastro do município."
            : "O cadastro é validado no cadastro de contribuintes do município."}
        </p>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full px-4 py-3 h-auto rounded-xl border-gray-300 focus-visible:ring-blue-500 text-sm";
const btnCls = "w-full px-4 py-3 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";
function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</Label>
      {children}
      {erro && (
        <p className="text-xs text-destructive mt-1" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
