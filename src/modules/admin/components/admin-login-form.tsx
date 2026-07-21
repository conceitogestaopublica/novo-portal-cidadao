"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShieldUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/shared/lib/client-api";
import { adminLoginSchema, type AdminLoginInput } from "@/modules/admin/schemas/admin-login.schema";

export function AdminLoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema), defaultValues: { senha: "" } });

  async function onSubmit(data: AdminLoginInput) {
    try {
      await postJson("/api/admin/login", data, "Falha ao entrar");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldUser className="text-white size-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Área administrativa</h1>
          <p className="text-sm text-gray-500 mt-1">Gerenciar a Carta de Serviços.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 flex items-start gap-1.5" role="alert">
            <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Senha do administrador</Label>
            <Input
              autoFocus
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 h-auto rounded-xl border-gray-300 focus-visible:ring-slate-500 text-sm"
              {...register("senha")}
            />
            {errors.senha && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {errors.senha.message}
              </p>
            )}
          </div>
          <Button disabled={isSubmitting} className="w-full px-4 py-3 h-auto rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 disabled:opacity-60">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
