"use client";

import { Suspense } from "react";
import { RedefinirForm } from "@/modules/auth";

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
