"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Ponto {
  processo: string;
  count: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: Ponto }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="text-text-secondary mb-0.5">{payload[0].payload.processo}</p>
      <p className="font-syne font-semibold text-text-primary">
        {payload[0].value} análise{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

const CORES = [
  "#00c2ff",
  "#0ea5e9",
  "#38bdf8",
  "#7dd3fc",
  "#bae6fd",
  "#e0f2fe",
];

export function ProcessosDistribuicao({ dados }: { dados: Ponto[] }) {
  if (dados.length === 0) {
    return (
      <div>
        <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-4">
          Processos recomendados
        </p>
        <div className="flex items-center justify-center h-40 text-text-secondary text-sm">
          Nenhuma análise concluída ainda.
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-4">
        Processos recomendados
      </p>
      <ResponsiveContainer width="100%" height={Math.max(140, dados.length * 44)}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2128" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            stroke="#4b5563"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="processo"
            width={118}
            stroke="#4b5563"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e2128" }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {dados.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
