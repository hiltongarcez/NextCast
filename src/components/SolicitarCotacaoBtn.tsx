"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  analiseId: string;
  jasolicitada?: boolean;
}

export function SolicitarCotacaoBtn({ analiseId, jasolicitada = false }: Props) {
  const [solicitada, setSolicitada] = useState(jasolicitada);
  const [loading, setLoading] = useState(false);

  async function solicitar() {
    if (solicitada || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analise/${analiseId}/cotacao`, { method: "POST" });
      if (res.ok) setSolicitada(true);
    } finally {
      setLoading(false);
    }
  }

  if (solicitada) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-success text-sm font-medium">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Cotação solicitada
      </div>
    );
  }

  return (
    <Button onClick={solicitar} loading={loading} size="sm">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
      Solicitar Cotação
    </Button>
  );
}
