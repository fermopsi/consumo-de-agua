export interface ConsumoItem {
  anio: number;
  mes: number;
  consumo_m3: number;
}

export interface MedidorInfo {
  numero: string;
  contrato: string;
  titular?: string | null;
  direccion?: string | null;
}

export interface Estadisticas {
  promedio: number | null;
  maximo: number | null;
  mes_maximo: number | null;
  anio_maximo: number | null;
  minimo: number | null;
  mes_minimo: number | null;
  anio_minimo: number | null;
  ultimo_consumo: number | null;
  variacion_pct: number | null;
}

export interface ConsultaResponse {
  medidor: MedidorInfo;
  consumos: ConsumoItem[];
  estadisticas: Estadisticas;
}

export const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ---------- Admin ----------

export interface MedidorOut {
  id: number;
  numero_medidor: string;
  numero_contrato: string;
  nombre_titular: string | null;
  direccion: string | null;
  estado: string;
}

export interface ConsumoOut {
  id: number;
  medidor_id: number;
  anio: number;
  mes: number;
  consumo_m3: number;
}

export interface AdminStats {
  total_medidores: number;
  total_contratos: number;
  total_consumos: number;
  ultima_importacion: string | null;
  errores_ultima_importacion: number;
}

export interface ImportResult {
  filename: string;
  registros_procesados: number;
  registros_importados: number;
  registros_con_errores: number;
  duplicados: number;
  errores: string[];
}
