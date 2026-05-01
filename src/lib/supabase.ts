import { createClient } from '@supabase/supabase-js'
import { appEnv, isSupabaseConfigured } from './env'

export const supabase = isSupabaseConfigured
  ? createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey)
  : null
