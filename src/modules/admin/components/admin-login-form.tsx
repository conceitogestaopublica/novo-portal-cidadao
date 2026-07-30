"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShieldUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLoginSchema, type AdminLoginInput } from "@/modules/admin/schemas/admin-login.schema";
import { useLoginAdmin } from "../hooks/use-login";

export function AdminLoginForm() {
  const router = useRouter();
  const loginMutation = useLoginAdmin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema), defaultValues: { email: "", senha: "" } });

  async function onSubmit(data: AdminLoginInput) {
    try {
      await loginMutation.mutateAsync(data);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Erro" });
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldUser className="text-white size-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Área administrativa</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciar a Carta de Serviços.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-start gap-1.5" role="alert">
            <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-mail</Label>
            <Input
              autoFocus
              type="email"
              placeholder="seu@email.com"
              className="mt-1 w-full px-4 py-3 h-auto rounded-xl border-border focus-visible:ring-slate-500 text-sm"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 h-auto rounded-xl border-border focus-visible:ring-slate-500 text-sm"
              {...register("senha")}
            />
            {errors.senha && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {errors.senha.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={loginMutation.isPending} className="w-full px-4 py-3 h-auto rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 disabled:opacity-60">
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
