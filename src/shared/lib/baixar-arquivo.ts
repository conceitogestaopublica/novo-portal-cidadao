"use client";

/**
 * Baixa um arquivo binário (PDF etc.) de uma rota do BFF, abrindo em nova aba
 * só se a resposta for bem-sucedida. Um `<a href target="_blank">` cru abre a
 * aba antes de saber se o backend recusou (403 posse, documento cancelado) —
 * aí a aba mostra o JSON de erro cru em vez de nada acontecer.
 */
export async function baixarArquivo(url: string): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, mensagem: (data as { message?: string })?.message ?? "Não foi possível gerar o arquivo." };
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    return { ok: true };
  } catch {
    return { ok: false, mensagem: "Falha de rede ao gerar o arquivo." };
  }
}
