import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Validate if actual Supabase credentials are provided and not default template placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key' &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Graceful client setup
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(
  `[ZenitLabs-Core] Supabase integration status: ${
    isSupabaseConfigured ? 'CONNECTED (Production Mode)' : 'SIMULATING (ZenitLabs-Engine Local Mode)'
  }`
);
