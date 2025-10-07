import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://apqempqvdlunozbsltpp.supabase.co';
const SUPABASE_KEY = sb_publishable_Yrh3s_tIOLJgJ0o5NQmOBg_iowVR607;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export { supabase };