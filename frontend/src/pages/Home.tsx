import { Link } from "react-router-dom";
import ConsultaForm from "../components/ConsultaForm";
import Dashboard from "../components/Dashboard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useConsulta } from "../hooks/useConsulta";

export default function Home() {
  const { loading, error, resultado, consultar, reiniciar } = useConsulta();

  return (
    <div className="min-h-screen bg-gradient-to-b from-water-50 to-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-water-600 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0014 0c0-4.5-7-13-7-13z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800">Consulta de Consumo</span>
          </div>
          <Link to="/admin" className="text-sm text-slate-400 hover:text-slate-600">
            Acceso administrativo
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-10 sm:px-6">
        {!resultado && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Consulta de Consumo de Agua
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Ingrese sus datos para consultar el historial de consumo de su medidor.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <ConsultaForm onSubmit={consultar} loading={loading} />
            </div>

            {loading && <LoadingSpinner />}
            {error && !loading && (
              <div className="mt-6">
                <ErrorMessage message={error} />
              </div>
            )}
          </div>
        )}

        {resultado && (
          <Dashboard
            resultado={resultado}
            onNuevaConsulta={() => {
              reiniciar();
            }}
          />
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        Portal institucional de consulta de consumo de agua.
      </footer>
    </div>
  );
}
