import { createClient } from '@supabase/supabase-js'

const url = 'https://bahbxcwpkqpmdjwdshot.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = key ? createClient(url, key, {
  auth: { storageKey: 'chhl-tdf-auth', flowType: 'pkce' },
}) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}
