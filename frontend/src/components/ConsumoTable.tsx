import { ConsumoItem, NOMBRES_MESES } from "../types";

interface Props {
  consumos: ConsumoItem[];
  anio: number;
}

export default function ConsumoTable({ consumos, anio }: Props) {
  const porMes = new Map<number, number>();
  consumos.filter((c) => c.anio === anio).forEach((c) => porMes.set(c.mes, c.consumo_m3));

  const mesesConDatos = Array.from(porMes.keys());
  const ultimoMesConDato = mesesConDatos.length > 0 ? Math.max(...mesesConDatos) : null;

  return (
    <div className="py-4">
      <h3 className="mb-3 text-sm font-semibold text-ink-soft">Detalle por mes</h3>
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-line">
          {NOMBRES_MESES.map((nombre, idx) => {
            const mes = idx + 1;
            const valor = porMes.get(mes);
            const esActual = mes === ultimoMesConDato;
            return (
              <tr key={mes} className={esActual ? "border-b-2 border-water-600" : ""}>
                <td
                  className={`relative py-2.5 pl-3 ${
                    esActual ? "font-semibold text-ink" : "text-ink-soft"
                  }`}
                >
                  {esActual && (
                    <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-water-600" />
                  )}
                  {nombre}
                </td>
                <td className="py-2.5 pr-1 text-right font-mono font-medium text-ink">
                  {valor !== undefined ? (
                    `${valor} m³`
                  ) : (
                    <span className="font-sans text-ink-soft">Sin información</span>
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
