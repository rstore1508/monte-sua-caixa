window.TUGUINHO_SUPABASE_URL = "https://xplvzmmpkmqqgifbrdue.supabase.co";
window.TUGUINHO_SUPABASE_KEY = "sb_publishable_JSCF44j1_BLFu3Za8o-mzA_ZmScy7_Q";
window.TUGUINHO_ASSET_BASE = "https://xplvzmmpkmqqgifbrdue.supabase.co/storage/v1/object/public/tuguinho-assets";

window.tuguinhoDb = window.supabase.createClient(
  window.TUGUINHO_SUPABASE_URL,
  window.TUGUINHO_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
