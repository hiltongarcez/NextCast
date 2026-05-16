"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function NovaAnalisePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [material, setMaterial] = useState("");
  const [volumeTipo, setVolumeTipo] = useState<"mensal" | "eventual" | "">("");
  const [volumeQtd, setVolumeQtd] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file || file.type === "application/pdf") {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(selected: File) {
    if (!ACCEPTED.includes(selected.type)) {
      setError("Formato não suportado. Use JPEG, PNG, WEBP ou PDF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    setError("");
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Informe um título para a análise.");
      return;
    }
    if (!volumeTipo) {
      setError("Selecione o tipo de volume de produção.");
      return;
    }
    if (!volumeQtd || Number(volumeQtd) <= 0) {
      setError("Informe a quantidade de produção.");
      return;
    }
    if (!file && !descricao.trim()) {
      setError("Envie um arquivo ou forneça uma descrição da peça.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Inserir análise no banco
      const { data: analise, error: dbError } = await supabase
        .from("analises")
        .insert({
          comprador_id: user.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          status: "processando",
          arquivo_tipo: file ? (file.type === "application/pdf" ? "pdf" : "imagem") : null,
        })
        .select()
        .single();

      if (dbError || !analise) throw new Error(dbError?.message ?? "Erro ao criar análise");

      // Preparar FormData para a API route
      const formData = new FormData();
      formData.append("analise_id", analise.id);
      formData.append("titulo", titulo.trim());
      formData.append("descricao", descricao.trim());
      formData.append("material", material.trim());
      formData.append("volume_tipo", volumeTipo);
      formData.append("volume_qtd", volumeQtd);
      if (file) formData.append("arquivo", file);

      const response = await fetch("/api/analise", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error ?? "Erro ao processar análise");
      }

      router.push(`/resultado/${analise.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Nova Análise</h1>
        <p className="text-text-secondary mt-1">
          Envie uma imagem ou PDF da peça metálica para receber a recomendação de processo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-syne font-semibold text-text-primary text-sm">Informações da peça</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="Título da análise"
              placeholder="Ex: Flange de aço carbono Ø150mm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
            <Input
              label="Material (opcional)"
              placeholder="Ex: Aço inox 316, Alumínio 6061, Aço SAE 1045..."
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Descrição (opcional)
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-sans bg-surface-2 border border-border text-text-primary placeholder-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 resize-none"
                rows={3}
                placeholder="Descreva dimensões, tolerâncias ou qualquer detalhe relevante..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-syne font-semibold text-text-primary text-sm">Volume de produção</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {(["mensal", "eventual"] as const).map((tipo) => {
                const label = tipo === "mensal" ? "Produção mensal contínua" : "Produção eventual / única";
                const desc = tipo === "mensal" ? "Peças fabricadas todo mês" : "Lote único ou pedido pontual";
                return (
                  <label
                    key={tipo}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      volumeTipo === tipo
                        ? "border-accent/60 bg-accent/5"
                        : "border-border hover:border-accent/30 hover:bg-surface-2/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="volume_tipo"
                      value={tipo}
                      checked={volumeTipo === tipo}
                      onChange={() => setVolumeTipo(tipo)}
                      className="mt-0.5 accent-accent"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Quantidade{" "}
                <span className="font-normal text-text-secondary/70">
                  ({volumeTipo === "mensal" ? "peças/mês" : volumeTipo === "eventual" ? "peças total" : "peças"})
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={volumeQtd}
                  onChange={(e) => setVolumeQtd(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-sans bg-surface-2 border border-border text-text-primary placeholder-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-syne font-semibold text-text-primary text-sm">Arquivo da peça</h2>
          </CardHeader>
          <CardContent>
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${dragging
                  ? "border-accent bg-accent/5"
                  : file
                    ? "border-success/40 bg-success/5"
                    : "border-border hover:border-accent/40 hover:bg-surface-2/50"
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview da peça"
                      className="max-h-48 rounded-lg object-contain border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-error hover:underline mt-1"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Arraste ou clique para enviar
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      JPEG, PNG, WEBP ou PDF — máximo 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 border border-error/20">
            <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm text-error">{error}</span>
          </div>
        )}

        <Button type="submit" loading={loading} size="lg">
          {loading ? "Analisando..." : "Enviar para análise"}
        </Button>
      </form>
    </div>
  );
}
