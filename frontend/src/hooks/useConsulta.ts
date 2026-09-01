import { useState } from "react";
import { consultarConsumo, ConsultaError } from "../services/consulta";
import { ConsultaResponse } from "../types";

export function useConsulta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConsultaResponse | null>(null);

  async function consultar(numeroMedidor: string, numeroContrato: string) {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const data = await consultarConsumo(numeroMedidor, numeroContrato);
      setResultado(data);
    } catch (err) {
      if (err instanceof ConsultaError) {
        setError(err.message);
      } else {
        setError("No fue posible realizar la consulta. Intente nuevamente en unos momentos.");
      }
    } finally {
      setLoading(false);
    }
  }

  function reiniciar() {
    setResultado(null);
    setError(null);
  }

  return { loading, error, resultado, consultar, reiniciar };
}
