import { supabase } from "../lib/supabase";
import { AdminStats, ConsumoOut, MedidorOut } from "../types";

export class AdminError extends Error {}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [{ count: totalMedidores }, { count: totalConsumos }, { data: contratosRows }, { data: ultimoLog }] =
    await Promise.all([
      supabase.from("medidores").select("id", { count: "exact", head: true }),
      supabase.from("consumos").select("id", { count: "exact", head: true }),
      supabase.from("medidores").select("numero_contrato"),
      supabase
        .from("import_logs")
        .select("created_at, registros_con_errores")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const totalContratos = new Set((contratosRows ?? []).map((r) => r.numero_contrato)).size;

  return {
    total_medidores: totalMedidores ?? 0,
    total_contratos: totalContratos,
    total_consumos: totalConsumos ?? 0,
    ultima_importacion: ultimoLog?.created_at ?? null,
    errores_ultima_importacion: ultimoLog?.registros_con_errores ?? 0,
  };
}

export async function fetchMedidores(q?: string): Promise<MedidorOut[]> {
  let query = supabase.from("medidores").select("*").order("id", { ascending: false }).limit(200);
  if (q) {
    query = query.or(`numero_medidor.ilike.%${q}%,numero_contrato.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw new AdminError(error.message);
  return (data ?? []) as MedidorOut[];
}

export async function crearMedidor(payload: {
  numero_medidor: string;
  numero_contrato: string;
  nombre_titular?: string | null;
  direccion?: string | null;
}): Promise<MedidorOut> {
  const existente = await supabase
    .from("medidores")
    .select("id")
    .eq("numero_medidor", payload.numero_medidor)
    .eq("numero_contrato", payload.numero_contrato)
    .maybeSingle();

  if (existente.data) {
    throw new AdminError("Ya existe un medidor con ese número y contrato.");
  }

  const { data, error } = await supabase
    .from("medidores")
    .insert({
      numero_medidor: payload.numero_medidor,
      numero_contrato: payload.numero_contrato,
      nombre_titular: payload.nombre_titular || null,
      direccion: payload.direccion || null,
    })
    .select()
    .single();

  if (error) throw new AdminError(error.message);
  return data as MedidorOut;
}

export async function desactivarMedidor(id: number): Promise<MedidorOut> {
  const { data, error } = await supabase
    .from("medidores")
    .update({ estado: "inactivo" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AdminError(error.message);
  return data as MedidorOut;
}

export async function fetchConsumosDeMedidor(medidorId: number): Promise<ConsumoOut[]> {
  const { data, error } = await supabase
    .from("consumos")
    .select("*")
    .eq("medidor_id", medidorId)
    .order("anio", { ascending: true })
    .order("mes", { ascending: true });

  if (error) throw new AdminError(error.message);
  return (data ?? []) as ConsumoOut[];
}
