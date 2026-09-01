import { useMemo, useState } from "react";
import { ConsultaResponse, NOMBRES_MESES } from "../types";
import StatCard from "./StatCard";
import ConsumoTable from "./ConsumoTable";
import ConsumoChart from "./ConsumoChart";
import GaugeChart from "./GaugeChart";

interface Props {
  resultado: ConsultaResponse;
  onNuevaConsulta: () => void;
}

export default function Dashboard({ resultado, onNuevaConsulta }: Props) {
  const { medidor, consumos, estadisticas } = resultado;

  const aniosDisponibles = useMemo(() => {
    const set = new Set(consumos.map((c) => c.anio));
    return Array.from(set).sort((a, b) => b - a);
  }, [consumos]);

  const [anioSeleccionado, setAnioSeleccionado] = useState<number | undefined>(
    aniosDisponibles[0]
  );
  const anio = anioSeleccionado ?? aniosDisponibles[0];

  const gaugeMax = Math.max(estadisticas.maximo ?? 0, estadisticas.ultimo_consumo ?? 0, 1) * 1.15;

  return (
    <div className="w-full max-w-4xl">
      {/* Meter / contract info */}
      <div className="flex flex-col justify-between gap-3 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-ink">Información del medidor</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Medidor: <span className="font-mono font-medium text-ink">{medidor.numero}</span>
            {"  ·  "}
            Contrato: <span className="font-mono font-medium text-ink">{medidor.contrato}</span>
          </p>
          {medidor.titular && (
            <p className="text-sm text-ink-soft">
              Titular: <span className="font-medium text-ink">{medidor.titular}</span>
            </p>
          )}
          {medidor.direccion && <p className="text-sm text-ink-soft">{medidor.direccion}</p>}
          {anio && <p className="mt-1 text-xs text-ink-soft">Periodo consultado: {anio}</p>}
        </div>
        <button
          onClick={onNuevaConsulta}
          className="self-start rounded-lg border border-water-600 px-4 py-2 text-sm font-semibold text-water-700 transition hover:bg-water-50 sm:self-auto"
        >
          Nueva consulta
        </button>
      </div>
      <div className="tick-rule" />

      {/* Period filter */}
      {aniosDisponibles.length > 1 && (
        <div className="flex items-center gap-2 py-4">
          <label htmlFor="anio" className="text-sm font-medium text-ink-soft">
            Periodo:
          </label>
          <select
            id="anio"
            value={anio}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-water-400"
          >
            {aniosDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {consumos.length === 0 ? (
        <div className="py-10 text-center text-ink-soft">
          No existen registros de consumo para el periodo seleccionado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 py-6 sm:grid-cols-[220px_1fr] sm:items-center">
            <GaugeChart
              value={estadisticas.ultimo_consumo ?? 0}
              max={gaugeMax}
              label="Consumo del último mes"
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              <StatCard
                titulo="Último consumo"
                valor={
                  estadisticas.ultimo_consumo !== null ? `${estadisticas.ultimo_consumo} m³` : "—"
                }
                subtitulo={
                  estadisticas.variacion_pct !== null
                    ? `${estadisticas.variacion_pct >= 0 ? "↑" : "↓"} ${Math.abs(
                        estadisticas.variacion_pct
                      )}% vs. mes anterior`
                    : undefined
                }
                acento={
                  estadisticas.variacion_pct === null
                    ? "default"
                    : estadisticas.variacion_pct >= 0
                    ? "up"
                    : "down"
                }
              />
              <StatCard
                titulo="Consumo promedio"
                valor={estadisticas.promedio !== null ? `${estadisticas.promedio} m³` : "—"}
              />
              <StatCard
                titulo="Mayor consumo"
                valor={estadisticas.maximo !== null ? `${estadisticas.maximo} m³` : "—"}
                subtitulo={
                  estadisticas.mes_maximo ? NOMBRES_MESES[estadisticas.mes_maximo - 1] : undefined
                }
                acento="up"
              />
              <StatCard
                titulo="Menor consumo"
                valor={estadisticas.minimo !== null ? `${estadisticas.minimo} m³` : "—"}
                subtitulo={
                  estadisticas.mes_minimo ? NOMBRES_MESES[estadisticas.mes_minimo - 1] : undefined
                }
                acento="down"
              />
            </div>
          </div>

          {anio !== undefined && (
            <>
              <div className="tick-rule tight" />
              <ConsumoChart consumos={consumos} anio={anio} />
              <div className="tick-rule tight" />
              <ConsumoTable consumos={consumos} anio={anio} />
            </>
          )}
        </>
      )}
    </div>
  );
}
