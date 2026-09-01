import { ConsumoItem, Estadisticas } from "../types";

function sortKey(c: ConsumoItem) {
  return c.anio * 100 + c.mes;
}

function promedio(consumos: ConsumoItem[]): number | null {
  if (consumos.length === 0) return null;
  const total = consumos.reduce((acc, c) => acc + c.consumo_m3, 0);
  return Math.round((total / consumos.length) * 100) / 100;
}

function maximo(consumos: ConsumoItem[]): ConsumoItem | null {
  if (consumos.length === 0) return null;
  return consumos.reduce((a, b) => (b.consumo_m3 > a.consumo_m3 ? b : a));
}

function minimo(consumos: ConsumoItem[]): ConsumoItem | null {
  if (consumos.length === 0) return null;
  return consumos.reduce((a, b) => (b.consumo_m3 < a.consumo_m3 ? b : a));
}

function ultimo(consumos: ConsumoItem[]): ConsumoItem | null {
  if (consumos.length === 0) return null;
  return consumos.reduce((a, b) => (sortKey(b) > sortKey(a) ? b : a));
}

function variacionMensual(consumos: ConsumoItem[]): number | null {
  if (consumos.length < 2) return null;
  const ordenados = [...consumos].sort((a, b) => sortKey(a) - sortKey(b));
  const actual = ordenados[ordenados.length - 1];
  const anterior = ordenados[ordenados.length - 2];

  let anioEsperado = actual.anio;
  let mesEsperado = actual.mes - 1;
  if (mesEsperado === 0) {
    mesEsperado = 12;
    anioEsperado -= 1;
  }

  if (anterior.anio !== anioEsperado || anterior.mes !== mesEsperado) return null;
  if (anterior.consumo_m3 === 0) return null;

  const variacion = ((actual.consumo_m3 - anterior.consumo_m3) / anterior.consumo_m3) * 100;
  return Math.round(variacion * 100) / 100;
}

export function construirEstadisticas(consumos: ConsumoItem[]): Estadisticas {
  const max = maximo(consumos);
  const min = minimo(consumos);
  const ult = ultimo(consumos);

  return {
    promedio: promedio(consumos),
    maximo: max ? max.consumo_m3 : null,
    mes_maximo: max ? max.mes : null,
    anio_maximo: max ? max.anio : null,
    minimo: min ? min.consumo_m3 : null,
    mes_minimo: min ? min.mes : null,
    anio_minimo: min ? min.anio : null,
    ultimo_consumo: ult ? ult.consumo_m3 : null,
    variacion_pct: variacionMensual(consumos),
  };
}
