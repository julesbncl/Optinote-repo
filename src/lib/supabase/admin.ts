import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client Supabase avec la clé service_role : contourne totalement la RLS.
// À utiliser UNIQUEMENT côté serveur (routes /api/admin/*), et seulement
// après avoir vérifié que l'utilisateur courant est bien admin.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
