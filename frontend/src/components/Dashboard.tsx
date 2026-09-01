import { useMemo, useState } from "react";
import { ConsultaResponse, NOMBRES_MESES } from "../types";
import StatCard from "./StatCard";
import ConsumoTable from "./ConsumoTable";
import ConsumoChart from "./ConsumoChart";

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

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Meter / contract info */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Información del medidor</h2>
          <p className="mt-1 text-sm text-slate-600">
            Medidor: <span className="font-medium text-slate-900">{medidor.numero}</span>
            {"  ·  "}
            Contrato: <span className="font-medium text-slate-900">{medidor.contrato}</span>
          </p>
          {medidor.titular && (
            <p className="text-sm text-slate-600">
              Titular: <span className="font-medium text-slate-900">{medidor.titular}</span>
            </p>
          )}
          {medidor.direccion && <p className="text-sm text-slate-500">{medidor.direccion}</p>}
          {anio && <p className="mt-1 text-xs text-slate-400">Periodo consultado: {anio}</p>}
        </div>
        <button
          onClick={onNuevaConsulta}
          className="rounded-lg border border-water-600 px-4 py-2 text-sm font-semibold text-water-700 transition hover:bg-water-50"
        >
          Nueva consulta
        </button>
      </div>

      {/* Period filter */}
      {aniosDisponibles.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="anio" className="text-sm font-medium text-slate-600">
            Periodo:
          </label>
          <select
            id="anio"
            value={anio}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-water-400"
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          No existen registros de consumo para el periodo seleccionado.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              titulo="Último consumo"
              valor={
                estadisticas.ultimo_consumo !== null ? `${estadisticas.ultimo_consumo} m³` : "—"
              }
              subtitulo={
                estadisticas.variacion_pct !== null
                  ? `${estadisticas.variacion_pct >= 0 ? "↑" : "↓"} ${Math.abs(
                      estadisticas.variacion_pct
                    )}% respecto al mes anterior`
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
            />
            <StatCard
              titulo="Menor consumo"
              valor={estadisticas.minimo !== null ? `${estadisticas.minimo} m³` : "—"}
              subtitulo={
                estadisticas.mes_minimo ? NOMBRES_MESES[estadisticas.mes_minimo - 1] : undefined
              }
            />
          </div>

          {anio && <ConsumoChart consumos={consumos} anio={anio} />}
          {anio && <ConsumoTable consumos={consumos} anio={anio} />}
        </>
      )}
    </div>
  );
}
