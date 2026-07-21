"use client";

import { Suspense } from "react";
import { RedefinirForm } from "@/modules/auth";

export default function RedefinirPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto bg-card rounded-2xl border border-border p-8">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      }
    >
      <RedefinirForm />
    </Suspense>
  );
}
