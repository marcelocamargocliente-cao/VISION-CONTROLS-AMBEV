import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

// Aceita variações de nome para evitar problemas de digitação nas env vars
const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_PROJECT_URL ||
  'https://hiaexzlqctlvibusuxoj.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_KEY ||
  'sb_publishable_tn3oRuGPEgzrS0y3jEp8dw_sppYPuzT';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('mock-') &&
  supabaseUrl.startsWith('http')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
