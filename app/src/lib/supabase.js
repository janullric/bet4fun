import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL || '';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(URL && KEY);

// Se le env mancano il client è null: l'app mostra un avviso nella schermata
// Iscrizione anziché crashare al mount.
export const supabase = isSupabaseConfigured ? createClient(URL, KEY) : null;
