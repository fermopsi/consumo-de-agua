import { ConsumoItem, NOMBRES_MESES } from "../types";

interface Props {
  consumos: ConsumoItem[];
  anio: number;
}

export default function ConsumoTable({ consumos, anio }: Props) {
  const porMes = new Map<number, number>();
  consumos
    .filter((c) => c.anio === anio)
    .forEach((c) => porMes.set(c.mes, c.consumo_m3));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Mes</th>
            <th className="px-4 py-3 font-semibold">Consumo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {NOMBRES_MESES.map((nombre, idx) => {
            const mes = idx + 1;
            const valor = porMes.get(mes);
            return (
              <tr key={mes} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{nombre}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {valor !== undefined ? (
                    `${valor} m³`
                  ) : (
                    <span className="text-slate-400">Sin información</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
