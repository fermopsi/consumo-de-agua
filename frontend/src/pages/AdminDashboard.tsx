import { useEffect, useState, FormEvent } from "react";
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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  if (sessionLoading || !session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h1 className="text-sm font-semibold text-slate-800 sm:text-base">Panel administrativo</h1>
          <button
            onClick={handleLogout}
            className="shrink-0 text-sm text-slate-500 hover:text-slate-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        {error && <ErrorMessage message={error} />}
        {loading && <LoadingSpinner label="Cargando panel..." />}

        {stats && (
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="truncate text-[11px] uppercase text-slate-500 sm:text-xs">
                Total medidores
              </p>
              <p className="mt-1 text-lg font-bold text-water-700 sm:text-2xl">
                {stats.total_medidores}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="truncate text-[11px] uppercase text-slate-500 sm:text-xs">
                Total contratos
              </p>
              <p className="mt-1 text-lg font-bold text-water-700 sm:text-2xl">
                {stats.total_contratos}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="truncate text-[11px] uppercase text-slate-500 sm:text-xs">
                Registros de consumo
              </p>
              <p className="mt-1 text-lg font-bold text-water-700 sm:text-2xl">
                {stats.total_consumos}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="truncate text-[11px] uppercase text-slate-500 sm:text-xs">
                Última importación
              </p>
              <p className="mt-1 break-words text-xs font-medium text-slate-700 sm:text-sm">
                {stats.ultima_importacion
                  ? new Date(stats.ultima_importacion).toLocaleString()
                  : "Sin importaciones"}
              </p>
              {stats.errores_ultima_importacion > 0 && (
                <p className="text-xs text-red-500">
                  {stats.errores_ultima_importacion} errores en la última importación
                </p>
              )}
            </div>
          </section>
        )}

        {/* Import */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Importar Excel / CSV</h2>
          <p className="mt-1 text-sm text-slate-500">
            El archivo debe contener las columnas: numero_medidor, numero_contrato y los meses
            (enero, febrero, ...). Se procesa aquí mismo, no hace falta entrar a Supabase.
          </p>
          <form
            onSubmit={handleImportar}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-0 flex-1 sm:flex-none">
              <label className="mb-1 block text-xs font-medium text-slate-600">Archivo</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Año</label>
              <input
                type="number"
                value={anioImport}
                onChange={(e) => setAnioImport(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-24"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
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
          </form>

          {resultadoImport && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">Importación completada</p>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                <li>Registros procesados: {resultadoImport.registros_procesados}</li>
                <li>Registros importados: {resultadoImport.registros_importados}</li>
                <li>Registros con errores: {resultadoImport.registros_con_errores}</li>
                <li>Duplicados: {resultadoImport.duplicados}</li>
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

        {/* Create meter */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Crear medidor</h2>
          <form onSubmit={handleCrearMedidor} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Número de medidor"
              value={nuevoMedidor.numero_medidor}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, numero_medidor: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Número de contrato"
              value={nuevoMedidor.numero_contrato}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, numero_contrato: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Nombre del titular (opcional)"
              value={nuevoMedidor.nombre_titular}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, nombre_titular: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Dirección (opcional)"
              value={nuevoMedidor.direccion}
              onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, direccion: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={creando}
              className="sm:col-span-2 rounded-lg bg-water-600 px-4 py-2 text-sm font-semibold text-white hover:bg-water-700 disabled:opacity-60"
            >
              {creando ? "Creando..." : "Crear medidor"}
            </button>
          </form>
        </section>

        {/* Meters list */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="font-semibold text-slate-800">Medidores</h2>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                placeholder="Buscar por medidor o contrato"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm sm:flex-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Mobile / tablet: stacked cards (avoids awkward horizontal scroll) */}
          <div className="mt-4 space-y-3 md:hidden">
            {medidores.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{m.numero_medidor}</p>
                    <p className="text-slate-500">Contrato: {m.numero_contrato}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.estado === "activo"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.estado}
                  </span>
                </div>
                <p className="mt-2 text-slate-600">Titular: {m.nombre_titular ?? "—"}</p>
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
              <p className="py-6 text-center text-sm text-slate-400">
                No hay medidores para mostrar.
              </p>
            )}
          </div>

          {/* Desktop / large tablet: table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Medidor</th>
                  <th className="px-3 py-2 font-semibold">Contrato</th>
                  <th className="px-3 py-2 font-semibold">Titular</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medidores.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2">{m.numero_medidor}</td>
                    <td className="px-3 py-2">{m.numero_contrato}</td>
                    <td className="px-3 py-2">{m.nombre_titular ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.estado === "activo"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
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
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
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
