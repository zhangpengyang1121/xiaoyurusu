import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://guqraafzqxulyqzkpohf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IlHynpFq-PuJKH6laiL2Cg_9G4XPaUQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
