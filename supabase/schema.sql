-- ============================================================================
-- Consulta de Consumo de Agua — esquema completo para Supabase
-- ============================================================================
-- Cómo usar este archivo:
--   1. Abre tu proyecto en https://supabase.com/dashboard
--   2. Ve a "SQL Editor" -> "New query"
--   3. Pega TODO este archivo y presiona "Run" (una sola vez)
--   Esto crea las tablas, la seguridad (RLS) y la función pública de consulta.
--   No necesitas volver a "Table Editor" para nada de esto.
-- ============================================================================

-- ---------- Tabla: medidores ----------
create table if not exists public.medidores (
  id bigint generated always as identity primary key,
  numero_medidor text not null,
  numero_contrato text not null,
  nombre_titular text,
  direccion text,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_medidor_contrato unique (numero_medidor, numero_contrato)
);

create index if not exists idx_medidores_lookup
  on public.medidores (numero_medidor, numero_contrato);

-- ---------- Tabla: consumos ----------
create table if not exists public.consumos (
  id bigint generated always as identity primary key,
  medidor_id bigint not null references public.medidores (id) on delete cascade,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  consumo_m3 numeric not null check (consumo_m3 >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_medidor_anio_mes unique (medidor_id, anio, mes)
);

create index if not exists idx_consumos_medidor on public.consumos (medidor_id);

-- ---------- Tabla: import_logs (auditoría de importaciones) ----------
create table if not exists public.import_logs (
  id bigint generated always as identity primary key,
  filename text not null,
  registros_procesados int not null default 0,
  registros_importados int not null default 0,
  registros_con_errores int not null default 0,
  duplicados int not null default 0,
  detalles_errores jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Tabla auxiliar: control de rate limit de la consulta pública ----------
create table if not exists public.rate_limit_log (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_log_ip_time
  on public.rate_limit_log (ip, created_at);

-- ---------- Trigger genérico para updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_medidores_updated_at on public.medidores;
create trigger trg_medidores_updated_at
  before update on public.medidores
  for each row execute function public.set_updated_at();

drop trigger if exists trg_consumos_updated_at on public.consumos;
create trigger trg_consumos_updated_at
  before update on public.consumos
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Seguridad (Row Level Security)
-- ============================================================================
-- El frontend público (rol "anon") NO tiene acceso directo a estas tablas.
-- Solo puede leer datos a través de la función consultar_consumo() de abajo,
-- que valida medidor + contrato exactos antes de devolver algo.
-- El panel administrativo usa un usuario autenticado (Supabase Auth), que sí
-- tiene permiso completo sobre las tablas vía las políticas "authenticated".

alter table public.medidores enable row level security;
alter table public.consumos enable row level security;
alter table public.import_logs enable row level security;
alter table public.rate_limit_log enable row level security;

drop policy if exists "admin_full_access_medidores" on public.medidores;
create policy "admin_full_access_medidores"
  on public.medidores for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_full_access_consumos" on public.consumos;
create policy "admin_full_access_consumos"
  on public.consumos for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_full_access_import_logs" on public.import_logs;
create policy "admin_full_access_import_logs"
  on public.import_logs for all
  to authenticated
  using (true)
  with check (true);

-- rate_limit_log: nadie accede directamente; solo la función SECURITY DEFINER
-- de abajo la usa (esa función corre con privilegios propios, no con los del
-- rol que la llama), así que no necesita políticas adicionales.

-- ============================================================================
-- Función pública: consultar_consumo(numero_medidor, numero_contrato)
-- ============================================================================
-- Es la única forma en que el sitio público accede a los datos. Aplica:
--   - Coincidencia exacta de medidor + contrato (nunca revela cuál de los
--     dos campos es el incorrecto, igual que el backend original).
--   - Solo medidores en estado 'activo'.
--   - Rate limiting por IP (por defecto 20 solicitudes / minuto), usando el
--     header x-forwarded-for que Supabase/PostgREST expone automáticamente
--     — no requiere ninguna variable de entorno adicional.

create or replace function public.consultar_consumo(
  p_numero_medidor text,
  p_numero_contrato text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_intentos int;
  v_medidor public.medidores%rowtype;
  v_consumos jsonb;
begin
  -- ---- Rate limiting ----
  v_ip := coalesce(
    nullif(split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
      ',', 1
    ), ''),
    'unknown'
  );

  delete from public.rate_limit_log where created_at < now() - interval '1 minute';

  select count(*) into v_intentos
  from public.rate_limit_log
  where ip = v_ip and created_at > now() - interval '1 minute';

  if v_intentos >= 20 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.rate_limit_log (ip) values (v_ip);

  -- ---- Búsqueda ----
  select * into v_medidor
  from public.medidores
  where numero_medidor = trim(p_numero_medidor)
    and numero_contrato = trim(p_numero_contrato)
    and estado = 'activo'
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('anio', c.anio, 'mes', c.mes, 'consumo_m3', c.consumo_m3)
      order by c.anio, c.mes
    ),
    '[]'::jsonb
  )
  into v_consumos
  from public.consumos c
  where c.medidor_id = v_medidor.id;

  return jsonb_build_object(
    'found', true,
    'medidor', jsonb_build_object(
      'numero', v_medidor.numero_medidor,
      'contrato', v_medidor.numero_contrato,
      'titular', v_medidor.nombre_titular,
      'direccion', v_medidor.direccion
    ),
    'consumos', v_consumos
  );
end;
$$;

revoke all on function public.consultar_consumo(text, text) from public;
grant execute on function public.consultar_consumo(text, text) to anon, authenticated;

-- ============================================================================
-- Fin del esquema.
-- Siguiente paso: crea el usuario administrador en
-- Authentication -> Users -> Add user (email + contraseña), y usa esas
-- credenciales para entrar a /admin en la aplicación.
-- ============================================================================
