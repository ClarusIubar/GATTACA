export const appEnv = {
  adminUserId: import.meta.env.VITE_ADMIN_USER_ID?.trim() ?? '',
  cloudflareApiUrl: import.meta.env.VITE_CLOUDFLARE_API_URL?.trim() ?? '',
  enableDemoMode: import.meta.env.VITE_ENABLE_DEMO_MODE?.trim() ?? '',
}

export const isCloudflareConfigured = Boolean(appEnv.cloudflareApiUrl)
export const isDemoModeEnabled =
  appEnv.enableDemoMode === 'true' || import.meta.env.DEV || import.meta.env.MODE === 'test'
