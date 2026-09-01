import { Link } from "react-router-dom";
import ConsultaForm from "../components/ConsultaForm";
import Dashboard from "../components/Dashboard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useConsulta } from "../hooks/useConsulta";

export default function Home() {
  const { loading, error, resultado, consultar, reiniciar } = useConsulta();

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-water-600 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0014 0c0-4.5-7-13-7-13z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Consulta de Consumo</p>
              <p className="text-[11px] text-ink-soft">Portal de agua potable</p>
            </div>
          </div>
          <Link to="/admin" className="text-xs text-ink-soft hover:text-ink">
            Acceso administrativo
          </Link>
        </div>
        <div className="tick-rule" />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-10 sm:px-6">
        {!resultado && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-ink sm:text-[28px]">
              Revisa tu consumo de agua
            </h1>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">
              Ingresa los datos de tu medidor para ver tu historial mensual.
            </p>

            <div className="mt-8 rounded-xl border border-line border-l-[3px] border-l-water-600 bg-white p-6 shadow-sm sm:p-8">
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

      <footer className="py-6 text-center text-xs text-ink-soft">
        Portal institucional de consulta de consumo de agua.
      </footer>
    </div>
  );
}
