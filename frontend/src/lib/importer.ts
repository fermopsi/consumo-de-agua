/**
 * Importa medidores + consumos desde un archivo Excel/CSV directamente desde
 * el navegador hacia Supabase. Reemplaza al importador que antes vivía en el
 * backend (pandas), para que nunca sea necesario cargar datos manualmente
 * desde el Table Editor de Supabase.
 *
 * Formato esperado del archivo (igual que antes):
 *   numero_medidor, numero_contrato, [nombre_titular], [direccion],
 *   y opcionalmente una columna por mes: enero, febrero, ... diciembre.
 *
 * La importación nunca borra datos existentes. Un (medidor, año, mes) que ya
 * existe se reporta como "duplicado" y se deja intacto, salvo que se marque
 * "Sobrescribir existentes".
 */
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { ImportResult } from "../types";

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const REQUIRED_COLUMNS = ["numero_medidor", "numero_contrato"];
const BATCH_SIZE = 500;

function normalizeKey(k: string): string {
  return String(k).trim().toLowerCase().replace(/\s+/g, "_");
}

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim().toLowerCase();
  return s === "" || s === "nan";
}

async function readRows(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();
  const type = lower.endsWith(".csv") ? "string" : "array";
  const workbook =
    type === "string"
      ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string" })
      : XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  return rawRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      normalized[normalizeKey(key)] = row[key];
    }
    return normalized;
  });
}

interface MedidorKey {
  numero_medidor: string;
  numero_contrato: string;
}

function medidorCacheKey(numeroMedidor: string, numeroContrato: string): string {
  return `${numeroMedidor}||${numeroContrato}`;
}

async function loadMedidorCache(): Promise<Map<string, number>> {
  const cache = new Map<string, number>();
  const pageSize = 1000;
  let from = 0;

  // Paginate through all existing meters so the importer works correctly
  // for large institutional datasets, not just the first 1000 rows.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("medidores")
      .select("id, numero_medidor, numero_contrato")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    for (const row of data) {
      cache.set(medidorCacheKey(row.numero_medidor, row.numero_contrato), row.id);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return cache;
}

export async function importarArchivo(
  file: File,
  anio: number,
  overwrite: boolean
): Promise<ImportResult> {
  const errores: string[] = [];
  let registrosProcesados = 0;
  let registrosConErrores = 0;
  let registrosImportados = 0;

  let rows: Record<string, unknown>[];
  try {
    rows = await readRows(file);
  } catch (err) {
    return {
      filename: file.name,
      registros_procesados: 0,
      registros_importados: 0,
      registros_con_errores: 0,
      duplicados: 0,
      errores: [`No fue posible leer el archivo: ${(err as Error).message}`],
    };
  }

  if (rows.length === 0) {
    return {
      filename: file.name,
      registros_procesados: 0,
      registros_importados: 0,
      registros_con_errores: 0,
      duplicados: 0,
      errores: ["El archivo no contiene filas de datos."],
    };
  }

  const columnas = new Set(Object.keys(rows[0] ?? {}));
  const faltantes = REQUIRED_COLUMNS.filter((c) => !columnas.has(c));
  if (faltantes.length > 0) {
    return {
      filename: file.name,
      registros_procesados: 0,
      registros_importados: 0,
      registros_con_errores: 0,
      duplicados: 0,
      errores: [`Faltan columnas requeridas: ${faltantes.join(", ")}`],
    };
  }

  const mesColumnas = Object.keys(rows[0] ?? {}).filter((c) => c in MESES);

  const cache = await loadMedidorCache();
  const nuevosMedidores: (MedidorKey & { nombre_titular: string | null; direccion: string | null })[] = [];
  const nuevosVistos = new Set<string>();

  type FilaValida = {
    filaNum: number;
    key: string;
    valores: { mes: number; valor: number }[];
  };
  const filasValidas: FilaValida[] = [];

  rows.forEach((row, idx) => {
    registrosProcesados += 1;
    const filaNum = idx + 2; // +1 por índice 0, +1 por fila de encabezado

    const numeroMedidor = String(row.numero_medidor ?? "").trim();
    const numeroContrato = String(row.numero_contrato ?? "").trim();

    if (isBlank(numeroMedidor)) {
      registrosConErrores += 1;
      errores.push(`Fila ${filaNum}: número de medidor vacío.`);
      return;
    }
    if (isBlank(numeroContrato)) {
      registrosConErrores += 1;
      errores.push(`Fila ${filaNum}: número de contrato vacío.`);
      return;
    }

    const key = medidorCacheKey(numeroMedidor, numeroContrato);
    if (!cache.has(key) && !nuevosVistos.has(key)) {
      nuevosVistos.add(key);
      nuevosMedidores.push({
        numero_medidor: numeroMedidor,
        numero_contrato: numeroContrato,
        nombre_titular: isBlank(row.nombre_titular) ? null : String(row.nombre_titular).trim(),
        direccion: isBlank(row.direccion) ? null : String(row.direccion).trim(),
      });
    }

    let filaTuvoError = false;
    const valores: { mes: number; valor: number }[] = [];

    for (const col of mesColumnas) {
      const raw = row[col];
      if (isBlank(raw)) continue; // mes sin dato: se omite, no es error

      const parsed = Number(String(raw).replace(",", "."));
      if (Number.isNaN(parsed) || parsed < 0) {
        registrosConErrores += 1;
        errores.push(`Fila ${filaNum}: valor de consumo inválido en '${col}' (${String(raw)}).`);
        filaTuvoError = true;
        continue;
      }

      valores.push({ mes: MESES[col], valor: parsed });
    }

    if (!filaTuvoError) registrosImportados += 1;
    filasValidas.push({ filaNum, key, valores });
  });

  // Crear los medidores nuevos detectados en el archivo.
  if (nuevosMedidores.length > 0) {
    const { data, error } = await supabase.from("medidores").insert(nuevosMedidores).select();
    if (error) {
      errores.push(`No fue posible crear nuevos medidores: ${error.message}`);
    } else {
      for (const m of data ?? []) {
        cache.set(medidorCacheKey(m.numero_medidor, m.numero_contrato), m.id);
      }
    }
  }

  // Construir la lista completa de consumos a insertar/actualizar.
  const consumosAInsertar: { medidor_id: number; anio: number; mes: number; consumo_m3: number }[] = [];
  for (const fila of filasValidas) {
    const medidorId = cache.get(fila.key);
    if (!medidorId) continue; // el medidor no pudo crearse; ya se registró el error arriba
    for (const v of fila.valores) {
      consumosAInsertar.push({ medidor_id: medidorId, anio, mes: v.mes, consumo_m3: v.valor });
    }
  }

  let duplicados = 0;
  for (let i = 0; i < consumosAInsertar.length; i += BATCH_SIZE) {
    const batch = consumosAInsertar.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("consumos")
      .upsert(batch, {
        onConflict: "medidor_id,anio,mes",
        ignoreDuplicates: !overwrite,
      })
      .select();

    if (error) {
      errores.push(`Error al guardar un lote de consumos: ${error.message}`);
      continue;
    }

    if (!overwrite) {
      duplicados += batch.length - (data?.length ?? 0);
    }
  }

  // Registrar la importación para el panel (auditoría).
  await supabase.from("import_logs").insert({
    filename: file.name,
    registros_procesados: registrosProcesados,
    registros_importados: registrosImportados,
    registros_con_errores: registrosConErrores,
    duplicados,
    detalles_errores: errores.slice(0, 200),
  });

  return {
    filename: file.name,
    registros_procesados: registrosProcesados,
    registros_importados: registrosImportados,
    registros_con_errores: registrosConErrores,
    duplicados,
    errores: errores.slice(0, 50),
  };
}
