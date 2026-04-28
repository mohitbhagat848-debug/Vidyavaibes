const { createClient } = require('@supabase/supabase-js');

/**
 * ── Initialize Supabase Client ──────────────────────────────────────────────
 * 
 * You need two things from your Supabase Dashboard:
 * 1. Project URL (Project Settings > API)
 * 2. Anon Key (Project Settings > API)
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase Error: SUPABASE_URL or SUPABASE_KEY missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase initialized successfully');

module.exports = supabase;
