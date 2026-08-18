import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Fallback dummy client if URL is not configured yet
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(
  isValidUrl(supabaseUrl) ? (supabaseUrl as string) : dummyUrl,
  supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key' ? supabaseAnonKey : dummyKey
);

export const getServiceSupabase = (): SupabaseClient => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(
    isValidUrl(supabaseUrl) ? (supabaseUrl as string) : dummyUrl,
    serviceKey && serviceKey !== 'your_supabase_service_role_key' ? serviceKey : dummyKey
  );
};
