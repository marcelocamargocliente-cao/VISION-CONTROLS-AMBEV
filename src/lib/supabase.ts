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
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYWV4emxxY3RsdmlidXN1eG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2OTE5NzAsImV4cCI6MjEwMzI2Nzk3MH0.t8Fq250jW_4krOdxYXHFh2rCgcq4zhLXEnHN0RJ-wUk';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('mock-') &&
  supabaseUrl.startsWith('http')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
