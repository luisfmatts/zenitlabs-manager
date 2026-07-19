import { createClient } from '@supabase/supabase-js';

// Support both env and custom dynamic config stored in localStorage
export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem('zenitlabs_supabase_url') || '';
  const localKey = localStorage.getItem('zenitlabs_supabase_anon_key') || '';
  
  const url = localUrl || envUrl;
  const key = localKey || envKey;
  
  const isConfigured = Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('your-project') &&
    key !== 'your-anon-key' &&
    !key.includes('your-anon-key')
  );
  
  return { url, key, isConfigured };
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = config.isConfigured;

export const supabase = isSupabaseConfigured
  ? createClient(config.url, config.key, {
      db: { schema: 'zenitFlowers' }
    })
  : null;

export const getSupabaseClient = () => {
  const cfg = getSupabaseConfig();
  if (cfg.isConfigured) {
    try {
      return createClient(cfg.url, cfg.key, {
        db: { schema: 'zenitFlowers' }
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
    }
  }
  return null;
};

console.log(
  `[ZenitLabs-Core] Supabase integration status: ${
    isSupabaseConfigured ? 'CONNECTED (Production Mode)' : 'SIMULATING (ZenitLabs-Engine Local Mode)'
  }`
);
