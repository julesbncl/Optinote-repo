import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parser .env.local manuellement (mirrors scripts/set-pro.mjs)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, class_level, school_name, is_pro, onboarding_completed, is_visible_on_school, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erreur query profiles:', error)
    process.exit(1)
  }

  console.log(`Total profils: ${profiles.length}\n`)
  profiles.forEach((p, i) => {
    console.log(
      `${i + 1}. id=${p.id} | email=${p.email} | full_name=${p.full_name ?? ''} | class=${p.class_level ?? ''} | school=${p.school_name ?? ''} | is_pro=${p.is_pro} | onboarding=${p.onboarding_completed} | visible=${p.is_visible_on_school} | created_at=${p.created_at}`
    )
  })
}

run().catch(console.error)
