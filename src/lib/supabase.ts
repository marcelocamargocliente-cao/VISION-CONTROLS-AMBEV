import { createClient } from '@supabase/supabase-js';

// Credenciais fixas — a publishable key é segura no browser (protegida por RLS).
// Não usamos env vars aqui porque valores legados/incorretos no Vercel quebravam a conexão.
const supabaseUrl = 'https://hiaexzlqctlvibusuxoj.supabase.co';
const supabaseAnonKey = 'sb_publishable_tn3oRuGPEgzrS0y3jEp8dw_sppYPuzT';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
