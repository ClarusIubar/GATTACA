export const appEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
  adminUserId: import.meta.env.VITE_ADMIN_USER_ID?.trim() ?? '',
  cloudflareApiUrl: import.meta.env.VITE_CLOUDFLARE_API_URL?.trim() ?? '',
}

export const isSupabaseConfigured = Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey)
export const isCloudflareConfigured = Boolean(appEnv.cloudflareApiUrl)
