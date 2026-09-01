import { useEffect, useState, FormEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAdminSession } from "../hooks/useAdminSession";
import {
  fetchAdminStats,
  fetchMedidores,
  crearMedidor,
  desactivarMedidor,
  AdminError,
} from "../services/admin";
import { importarArchivo } from "../lib/importer";
import { AdminStats, MedidorOut, ImportResult } from "../types";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import StatCard from "../components/StatCard";

export default function AdminDashboard() {
  const { session, loading: sessionLoading } = useAdminSession();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [medidores, setMedidores] = useState<MedidorOut[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New meter form
  const [nuevoMedidor, setNuevoMedidor] = useState({
    numero_medidor: "",
    numero_contrato: "",
    nombre_titular: "",
    direccion: "",
  });
  const [creando, setCreando] = useState(false);

  // Import form
  const [archivo, setArchivo] = useState<File | null>(null);
  const [anioImport, setAnioImport] = useState(new Date().getFullYear());
  const [overwrite, setOverwrite] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin");
  }, [session, sessionLoading, navigate]);

  async function cargarDatos() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([fetchAdminStats(), fetchMedidores(q)]);
      setStats(s);
      setMedidores(m);
    } catch (err) {
      setError(err instanceof AdminError ? err.message : "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleBuscar(e: FormEvent) {
    e.preventDefault();
    cargarDatos();
  }

  async function handleCrearMedidor(e: FormEvent) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    try {
      await crearMedidor(nuevoMedidor);
      setNuevoMedidor({ numero_medidor: "", numero_contrato: "", nombre_titular: "", direccion: "" });
      await cargarDatos();
    } catch (err) {
      setError(err instanceof AdminError ? err.message : "No fue posible crear el medidor.");
    } finally {
      setCreando(false);
    }
  }

  async function handleDesactivar(id: number) {
    if (!confirm("¿Desactivar este medidor? Podrá reactivarlo editándolo más adelante.")) return;
    try {
      await desactivarMedidor(id);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof AdminError ? err.message : "No fue posible desactivar el medidor.");
    }
  }

  async function handleImportar(e: FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setImportando(true);
    setError(null);
    setResultadoImport(null);
    try {
      const resultado = await importarArchivo(archivo, anioImport, overwrite);
      setResultadoImport(resultado);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible importar el archivo.");
    } finally {
      setImportando(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setArchivo(file);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  if (sessionLoading || !session) return null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h1 className="text-sm font-semibold text-ink sm:text-base">Panel administrativo</h1>
          <button
            onClick={handleLogout}
            className="shrink-0 text-sm text-ink-soft hover:text-ink"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="tick-rule" />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}
        {loading && <LoadingSpinner label="Cargando panel..." />}

        {stats && (
          <>
            <section className="grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-4">
              <StatCard titulo="Total medidores" valor={String(stats.total_medidores)} />
              <StatCard titulo="Total contratos" valor={String(stats.total_contratos)} />
              <StatCard titulo="Registros de consumo" valor={String(stats.total_consumos)} />
              <StatCard
                titulo="Última importación"
                valor={
                  stats.ultima_importacion
                    ? new Date(stats.ultima_importacion).toLocaleDateString()
                    : "—"
                }
                subtitulo={
                  stats.errores_ultima_importacion > 0
                    ? `${stats.errores_ultima_importacion} errores`
                    : stats.ultima_importacion
                    ? new Date(stats.ultima_importacion).toLocaleTimeString()
                    : "Sin importaciones"
                }
                acento={stats.errores_ultima_importacion > 0 ? "up" : "default"}
              />
            </section>
            <div className="tick-rule" />
          </>
        )}

        {/* Import */}
        <section className="py-6">
          <h2 className="text-sm font-semibold text-ink">Importar Excel / CSV</h2>
          <p className="mt-1 max-w-[60ch] text-xs text-ink-soft">
            El archivo debe contener las columnas: numero_medidor, numero_contrato y los meses
            (enero, febrero, ...). Se procesa aquí mismo, no hace falta entrar a Supabase.
          </p>

          <form onSubmit={handleImportar} className="mt-4">
            <label
              htmlFor="archivo-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mb-4 block cursor-pointer rounded-lg border-[1.5px] border-dashed px-5 py-6 text-center text-sm transition ${
                dragOver
                  ? "border-water-500 bg-water-50 text-water-700"
                  : "border-line-strong text-ink-soft"
              }`}
            >
              {archivo ? (
                <span className="font-medium text-ink">{archivo.name}</span>
              ) : (
                <>
                  <span className="font-semibold text-ink">Arrastra un archivo</span> o haz clic
                  para seleccionarlo · .csv, .xlsx, .xls
                </>
              )}
              <input
                id="archivo-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div>
                <label className="mb-1 block text-xs text-ink-soft">Año</label>
                <input
                  type="number"
                  value={anioImport}
                  onChange={(e) => setAnioImport(Number(e.target.value))}
                  className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm sm:w-24"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                />
                Sobrescribir existentes
              </label>
              <button
                type="submit"
                disabled={!archivo || importando}
                className="w-full rounded-lg bg-water-600 px-4 py-2 text-sm font-semibold text-white hover:bg-water-700 disabled:opacity-60 sm:w-auto"
              >
                {importando ? "Importando..." : "Importar"}
              </button>
            </div>
          </form>

          {resultadoImport && (
            <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm">
              <p className="font-medium text-ink">Importación completada</p>
              <ul className="mt-1 space-y-0.5 text-ink-soft">
                <li>
                  Registros procesados:{" "}
                  <span className="font-mono text-ink">{resultadoImport.registros_procesados}</span>
                </li>
                <li>
                  Registros importados:{" "}
                  <span className="font-mono text-ink">{resultadoImport.registros_importados}</span>
                </li>
                <li>
                  Registros con errores:{" "}
                  <span className="font-mono text-ink">{resultadoImport.registros_con_errores}</span>
                </li>
                <li>
                  Duplicados:{" "}
                  <span className="font-mono text-ink">{resultadoImport.duplicados}</span>
                </li>
              </ul>
              {resultadoImport.errores.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600">Ver errores</summary>
                  <ul className="mt-1 list-disc pl-5 text-red-600">
                    {resultadoImport.errores.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </section>

        <div className="tick-rule tight" />

        {/* Create meter */}
        <section className="py-6">
          <h2 className="text-sm font-semibold text-ink">Crear medidor</h2>
          <form onSubmit={handleCrearMedidor} className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Número de medidor"
              value={nuevoMedidor.numero_medidor}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, numero_medidor: e.target.value })}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-water-500 focus:ring-2 focus:ring-water-400"
            />
            <input
              required
              placeholder="Número de contrato"
              value={nuevoMedidor.numero_contrato}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, numero_contrato: e.target.value })}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-water-500 focus:ring-2 focus:ring-water-400"
            />
            <input
              placeholder="Nombre del titular (opcional)"
              value={nuevoMedidor.nombre_titular}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, nombre_titular: e.target.value })}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-water-500 focus:ring-2 focus:ring-water-400"
            />
            <input
              placeholder="Dirección (opcional)"
              value={nuevoMedidor.direccion}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, direccion: e.target.value })}
              className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-water-500 focus:ring-2 focus:ring-water-400"
            />
            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-water-600 px-4 py-2 text-sm font-semibold text-white hover:bg-water-700 disabled:opacity-60 sm:col-span-2 sm:w-fit"
            >
              {creando ? "Creando..." : "Crear medidor"}
            </button>
          </form>
        </section>

        <div className="tick-rule tight" />

        {/* Meters list */}
        <section className="py-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-sm font-semibold text-ink">Medidores</h2>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                placeholder="Buscar por medidor o contrato"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line-strong px-3 py-1.5 text-sm sm:flex-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-line-strong px-3 py-1.5 text-sm hover:bg-white"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Mobile / tablet: stacked cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {medidores.map((m) => (
              <div key={m.id} className="rounded-lg border border-line border-l-2 border-l-line-strong p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-ink">{m.numero_medidor}</p>
                    <p className="text-ink-soft">Contrato: {m.numero_contrato}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.estado === "activo" ? "bg-moss/10 text-moss" : "bg-line/60 text-ink-soft"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        m.estado === "activo" ? "bg-moss" : "bg-ink-soft"
                      }`}
                    />
                    {m.estado}
                  </span>
                </div>
                <p className="mt-2 text-ink-soft">Titular: {m.nombre_titular ?? "—"}</p>
                {m.estado === "activo" && (
                  <button
                    onClick={() => handleDesactivar(m.id)}
                    className="mt-2 text-xs font-medium text-red-600 hover:underline"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            ))}
            {medidores.length === 0 && !loading && (
              <p className="py-6 text-center text-sm text-ink-soft">
                No hay medidores para mostrar.
              </p>
            )}
          </div>

          {/* Desktop / large tablet: table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-soft">
                <tr className="border-b border-line-strong">
                  <th className="px-3 py-2 text-xs font-medium">Medidor</th>
                  <th className="px-3 py-2 text-xs font-medium">Contrato</th>
                  <th className="px-3 py-2 text-xs font-medium">Titular</th>
                  <th className="px-3 py-2 text-xs font-medium">Estado</th>
                  <th className="px-3 py-2 text-xs font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {medidores.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-mono">{m.numero_medidor}</td>
                    <td className="px-3 py-2 font-mono">{m.numero_contrato}</td>
                    <td className="px-3 py-2">{m.nombre_titular ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.estado === "activo"
                            ? "bg-moss/10 text-moss"
                            : "bg-line/60 text-ink-soft"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.estado === "activo" ? "bg-moss" : "bg-ink-soft"
                          }`}
                        />
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {m.estado === "activo" && (
                        <button
                          onClick={() => handleDesactivar(m.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {medidores.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-ink-soft">
                      No hay medidores para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
