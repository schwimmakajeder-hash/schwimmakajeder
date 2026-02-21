import { createClient } from '@supabase/supabase-js';

// HINWEIS: Ersetze diese Werte mit deinen echten Supabase-Zugangsdaten aus dem Dashboard
// Einstellungen -> API -> Project URL & Project API Key (anon public)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
