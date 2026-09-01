import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ConsumoItem, NOMBRES_MESES } from "../types";

interface Props {
  consumos: ConsumoItem[];
  anio: number;
}

export default function ConsumoChart({ consumos, anio }: Props) {
  const data = NOMBRES_MESES.map((nombre, idx) => {
    const mes = idx + 1;
    const registro = consumos.find((c) => c.anio === anio && c.mes === mes);
    return {
      mes: nombre.slice(0, 3),
      consumo: registro ? registro.consumo_m3 : null,
    };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Gráfica de consumo (m³)</h3>
      <div className="h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              width={40}
              label={{ value: "m³", angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number | string) =>
                value === null || value === undefined ? "Sin datos" : [`${value} m³`, "Consumo"]
              }
              labelStyle={{ color: "#0f172a" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="consumo"
              stroke="#0399f2"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#0399f2" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
