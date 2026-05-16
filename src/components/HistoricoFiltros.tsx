"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { PROCESSO_LABELS } from "@/types";

export function HistoricoFiltros() {
  const router = useRouter();
  const params = useSearchParams();

  const [busca, setBusca] = useState(params.get("busca") ?? "");
  const status = params.get("status") ?? "";
  const processo = params.get("processo") ?? "";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza busca se o usuário navegar externamente (ex: botão voltar)
  useEffect(() => {
    setBusca(params.get("busca") ?? "");
  }, [params]);

  function buildUrl(overrides: { busca?: string; status?: string; processo?: string }) {
    const next = new URLSearchParams();
    const b = "busca" in overrides ? overrides.busca : busca;
    const s = "status" in overrides ? overrides.status : status;
    const p = "processo" in overrides ? overrides.processo : processo;
    if (b) next.set("busca", b);
    if (s) next.set("status", s);
    if (p) next.set("processo", p);
    return `/historico?${next.toString()}`;
  }

  function handleBusca(value: string) {
    setBusca(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      router.push(buildUrl({ busca: value }));
    }, 400);
  }

  function handleStatus(value: string) {
    router.push(buildUrl({ status: value }));
  }

  function handleProcesso(value: string) {
    router.push(buildUrl({ processo: value }));
  }

  function limpar() {
    setBusca("");
    router.push("/historico");
  }

  const temFiltro = busca || status || processo;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-52">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por título..."
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all"
        />
      </div>

      <select
        value={status}
        onChange={(e) => handleStatus(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all"
      >
        <option value="">Todos os status</option>
        <option value="concluida">Concluídas</option>
        <option value="processando">Processando</option>
        <option value="erro">Com erro</option>
      </select>

      <select
        value={processo}
        onChange={(e) => handleProcesso(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all"
      >
        <option value="">Todos os processos</option>
        {Object.entries(PROCESSO_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {temFiltro && (
        <button
          onClick={limpar}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpar filtros
        </button>
      )}
    </div>
  );
}
