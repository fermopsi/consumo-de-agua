import { supabase } from "../lib/supabase";
import { construirEstadisticas } from "../lib/stats";
import { ConsultaResponse, ConsumoItem } from "../types";

export class ConsultaError extends Error {}

const MENSAJE_NO_ENCONTRADO =
  "No se encontró información para los datos ingresados. Verifique su número de medidor y número de contrato.";

const MENSAJE_RATE_LIMIT =
  "Demasiadas solicitudes. Intente nuevamente en unos momentos.";

const MENSAJE_GENERICO =
  "No fue posible realizar la consulta. Intente nuevamente en unos momentos.";

export async function consultarConsumo(
  numeroMedidor: string,
  numeroContrato: string
): Promise<ConsultaResponse> {
  const { data, error } = await supabase.rpc("consultar_consumo", {
    p_numero_medidor: numeroMedidor,
    p_numero_contrato: numeroContrato,
  });

  if (error) {
    if (error.message?.includes("RATE_LIMIT")) {
      throw new ConsultaError(MENSAJE_RATE_LIMIT);
    }
    throw new ConsultaError(MENSAJE_GENERICO);
  }

  if (!data || data.found !== true) {
    throw new ConsultaError(MENSAJE_NO_ENCONTRADO);
  }

  const consumos: ConsumoItem[] = (data.consumos ?? []).map((c: ConsumoItem) => ({
    anio: c.anio,
    mes: c.mes,
    consumo_m3: c.consumo_m3,
  }));

  return {
    medidor: {
      numero: data.medidor.numero,
      contrato: data.medidor.contrato,
      titular: data.medidor.titular,
      direccion: data.medidor.direccion,
    },
    consumos,
    estadisticas: construirEstadisticas(consumos),
  };
}
