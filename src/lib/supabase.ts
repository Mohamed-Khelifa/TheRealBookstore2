import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if ((import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is missing. Please configure SUPABASE_URL in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);