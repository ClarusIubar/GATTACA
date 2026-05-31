export const appEnv = {
  adminUserId: import.meta.env.VITE_ADMIN_USER_ID?.trim() ?? '',
  cloudflareApiUrl: import.meta.env.VITE_CLOUDFLARE_API_URL?.trim() ?? '',
}

export const isCloudflareConfigured = Boolean(appEnv.cloudflareApiUrl)
