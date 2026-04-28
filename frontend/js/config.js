// AMEP Frontend Configuration
// Determine if we are running locally or in production
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
  // IMPORTANT: Once you deploy your backend to Render, replace the YOUR_RENDER_URL placeholder
  // with your actual Render URL (e.g., 'https://infinity-backend.onrender.com/api')
  API_URL: isLocalhost ? 'http://127.0.0.1:5000/api' : 'https://YOUR_RENDER_URL.onrender.com/api',
  
  // Supabase Configuration
  SUPABASE_URL: 'https://ygdjkjvysvlofvikbaoc.supabase.co',
  SUPABASE_KEY: 'sb_publishable_wKT8lruDzZC5e1QbFN2uLg_gQ7cknCr'
};

// Export to window if not in a module environment
window.AMEP_CONFIG = CONFIG;
