# Consulta de Consumo de Agua (versión Supabase)

Portal web para que los usuarios consulten su historial de consumo de agua
ingresando número de medidor + número de contrato, con panel administrativo
para gestionar medidores, consumos e **importar el Excel/CSV de origen desde
el propio software** (no desde el Table Editor de Supabase).

```
Frontend (React + Vite + Tailwind)  →  Supabase (Postgres + Auth)
```

No hay backend propio: todo corre contra Supabase. El sitio público nunca
consulta las tablas directamente — solo puede llamar a una función SQL
(`consultar_consumo`) que valida medidor + contrato exactos y no revela cuál
de los dos está mal, igual que antes. El panel admin sí puede leer/escribir
las tablas, pero solo si inició sesión (Supabase Auth) — eso lo controla RLS
(Row Level Security) en la base de datos, no el frontend.

## 1. Configurar el proyecto en Supabase (una sola vez)

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard).
2. Ve a **SQL Editor → New query**, pega el contenido completo de
   [`supabase/schema.sql`](./supabase/schema.sql) y presiona **Run**.
   Esto crea las tablas (`medidores`, `consumos`, `import_logs`), la
   seguridad (RLS) y la función pública de consulta con rate limiting
   incluido. Es lo único que se hace manualmente en Supabase — después de
   esto, **toda la carga de datos se hace desde la aplicación**, nunca desde
   el Table Editor.
3. Ve a **Authentication → Users → Add user** y crea el usuario
   administrador (correo + contraseña). Con eso entras al panel `/admin`.
4. Ve a **Settings → API** y copia:
   - **Project URL**
   - **anon public key**

## 2. Configurar el frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edita `.env` y pega los dos valores del paso anterior — es lo único que
necesita:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

```bash
npm run dev
```

La app queda en `http://localhost:5173`. Entra a `/admin`, inicia sesión con
el usuario que creaste en el paso 1.3.

## 3. Cargar los medidores desde el Excel/CSV de origen

Desde el panel (`/admin/dashboard` → **Importar Excel / CSV**):

- Sube el archivo `.xlsx`, `.xls` o `.csv`.
- Columnas esperadas: `numero_medidor`, `numero_contrato` y, opcionalmente,
  `nombre_titular`, `direccion`, y una columna por mes
  (`enero` ... `diciembre`).
- Indica el **año** al que corresponden esas columnas de mes.
- "Sobrescribir existentes" solo si quieres reemplazar consumos ya
  cargados para ese medidor/año/mes; si no, los duplicados se dejan
  intactos y se reportan en el resultado.

Todo el parseo y la carga ocurre en el navegador y escribe directo a
Supabase — no hay paso intermedio ni edición manual de tablas. Ver
[`imports/plantilla_importacion.csv`](./imports/plantilla_importacion.csv)
para un ejemplo de formato.

## 4. Desplegar

Con tu stack habitual (Netlify):

```bash
cd frontend
npm run build
```

Sube el proyecto a Netlify (o conecta el repo) usando `netlify.toml` en la
raíz — ya trae `base = frontend`, el comando de build y el redirect para que
las rutas de React Router funcionen. En Netlify, define las mismas dos
variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en
**Site settings → Environment variables**.

## Seguridad implementada

- El sitio público solo accede a los datos vía `consultar_consumo()`, una
  función SQL `SECURITY DEFINER` — las tablas están bloqueadas para el rol
  público (RLS). Nunca revela si el medidor o el contrato es el campo
  incorrecto.
- Rate limiting (20 solicitudes/minuto por IP) implementado dentro de esa
  misma función, usando el header `x-forwarded-for` que Supabase ya expone
  — no requiere ninguna variable de entorno ni servicio adicional.
- El panel administrativo requiere sesión de Supabase Auth; las políticas
  RLS solo permiten leer/escribir `medidores`, `consumos` e `import_logs`
  a usuarios autenticados.
- Ningún secreto vive en el código: el único valor "sensible" en el
  frontend es la anon key, que está diseñada para exponerse públicamente
  (el control real de acceso lo hace RLS en la base de datos).

## Diferencias frente a la versión anterior (FastAPI + Postgres propio)

- Ya no hay backend, Docker ni JWT/bcrypt manual: Supabase Auth reemplaza el
  login, y RLS reemplaza la capa de autorización que antes vivía en FastAPI.
- El importador de Excel/CSV que antes corría en el servidor (pandas) ahora
  corre en el navegador (librería `xlsx`) y escribe directo a Supabase.
- `.env` pasó de ~10 variables a solo 2 (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`).

## Estructura del proyecto

```
water-consumption-supabase/
├── frontend/
│   ├── src/
│   │   ├── lib/            # cliente Supabase, estadísticas, importador
│   │   ├── services/       # consulta pública + CRUD admin
│   │   ├── hooks/          # useConsulta, useAdminSession
│   │   ├── components/     # formulario, dashboard, tabla, gráfica
│   │   └── pages/          # Home, AdminLogin, AdminDashboard
│   └── .env.example
├── supabase/
│   └── schema.sql           # pegar una vez en el SQL Editor
├── imports/
│   └── plantilla_importacion.csv
└── netlify.toml
```
