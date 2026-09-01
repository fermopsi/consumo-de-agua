import { FormEvent, useState } from "react";

interface Props {
  onSubmit: (numeroMedidor: string, numeroContrato: string) => void;
  loading: boolean;
}

export default function ConsultaForm({ onSubmit, loading }: Props) {
  const [numeroMedidor, setNumeroMedidor] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [errores, setErrores] = useState<{ medidor?: string; contrato?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrores: { medidor?: string; contrato?: string } = {};
    if (!numeroMedidor.trim()) nextErrores.medidor = "Ingrese su número de medidor.";
    if (!numeroContrato.trim()) nextErrores.contrato = "Ingrese su número de contrato.";
    setErrores(nextErrores);

    if (Object.keys(nextErrores).length > 0) return;
    onSubmit(numeroMedidor.trim(), numeroContrato.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5" noValidate>
      <div>
        <label htmlFor="numero_medidor" className="mb-1 block text-sm font-medium text-slate-700">
          Número de medidor
        </label>
        <input
          id="numero_medidor"
          type="text"
          inputMode="text"
          autoComplete="off"
          value={numeroMedidor}
          onChange={(e) => setNumeroMedidor(e.target.value)}
          placeholder="Ej. 00012345"
          className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-water-400 ${
            errores.medidor ? "border-red-300" : "border-slate-300"
          }`}
          aria-invalid={!!errores.medidor}
          aria-describedby={errores.medidor ? "error-medidor" : undefined}
        />
        {errores.medidor && (
          <p id="error-medidor" className="mt-1 text-sm text-red-600">
            {errores.medidor}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="numero_contrato" className="mb-1 block text-sm font-medium text-slate-700">
          Número de contrato
        </label>
        <input
          id="numero_contrato"
          type="text"
          inputMode="text"
          autoComplete="off"
          value={numeroContrato}
          onChange={(e) => setNumeroContrato(e.target.value)}
          placeholder="Ej. 987654"
          className={`w-full rounded-lg border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-water-400 ${
            errores.contrato ? "border-red-300" : "border-slate-300"
          }`}
          aria-invalid={!!errores.contrato}
          aria-describedby={errores.contrato ? "error-contrato" : undefined}
        />
        {errores.contrato && (
          <p id="error-contrato" className="mt-1 text-sm text-red-600">
            {errores.contrato}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-water-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-water-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Consultando..." : "Consultar consumo"}
      </button>
    </form>
  );
}
