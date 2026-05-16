"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Ponto {
  label: string;
  total: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="text-text-secondary mb-0.5">Semana de {label}</p>
      <p className="font-syne font-semibold text-text-primary">
        {payload[0].value} análise{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function AnalisesPorSemana({ dados }: { dados: Ponto[] }) {
  const temDados = dados.some((d) => d.total > 0);

  return (
    <div>
      <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-4">
        Análises por semana
      </p>
      {!temDados ? (
        <div className="flex items-center justify-center h-40 text-text-secondary text-sm">
          Nenhuma análise nas últimas 8 semanas.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c2ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00c2ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2128" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#4b5563"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#4b5563"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00c2ff", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#00c2ff"
              strokeWidth={2}
              fill="url(#gradAccent)"
              dot={{ fill: "#00c2ff", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#00c2ff", r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
