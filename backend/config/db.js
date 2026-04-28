const supabase = require('./supabase');

/**
 * Placeholder for db connector when using Supabase
 */
const connectDB = async () => {
  try {
    // Supabase is initialized via the config, so this is just a health check
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase Connection Verified');
  } catch (error) {
    console.error(`❌ Supabase Connection Failed: ${error.message}`);
    // We don't exit here because Supabase might be unreachable but logic might still load
  }
};

module.exports = connectDB;
