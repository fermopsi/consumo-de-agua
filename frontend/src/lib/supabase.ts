import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in development if .env isn't set up, instead of silently
  // making requests to "undefined".
  // eslint-disable-next-line no-console
  console.error(
    "Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y completa los valores."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
