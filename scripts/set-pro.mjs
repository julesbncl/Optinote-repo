import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parser .env.local manuellement
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
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local')
  process.exit(1)
}

const targetEmail = process.argv[2] || 'julesbonicemo@gmail.com'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function run() {
  console.log(`🔍 Recherche de l'utilisateur : ${targetEmail}...`)

  // 1. Chercher dans auth.users
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('❌ Erreur récupération auth.users:', userError)
    process.exit(1)
  }

  const user = userData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase())

  if (!user) {
    console.log(`⚠️ Utilisateur non trouvé dans auth.users avec l'email ${targetEmail}.`)
    console.log('Utilisateurs disponibles dans auth.users :')
    userData.users.forEach((u) => console.log(` - ${u.email} (ID: ${u.id})`))
  } else {
    console.log(`✅ Utilisateur auth trouvé : ID = ${user.id}`)
  }

  // 2. Chercher dans profiles par email ou user ID
  let profileQuery = supabase.from('profiles').select('*')
  if (user) {
    profileQuery = profileQuery.eq('id', user.id)
  } else {
    profileQuery = profileQuery.eq('email', targetEmail)
  }

  const { data: profiles, error: profileErr } = await profileQuery
  if (profileErr) {
    console.error('❌ Erreur query profiles:', profileErr)
  } else {
    console.log('Profils existants trouvés :', profiles)
  }

  // 3. Mettre à jour ou créer le profil avec le statut Pro actif
  const profileId = user ? user.id : profiles?.[0]?.id
  if (profileId) {
    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        subscription_tier: 'monthly',
        subscription_status: 'active',
        subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', profileId)
      .select()

    if (updateErr) {
      console.error('❌ Erreur lors de la mise à jour Pro :', updateErr)
    } else {
      console.log('🎉 Profil mis à jour avec succès en MODE PRO :', updated)
    }
  } else {
    console.log('⚠️ Aucun ID de profil trouvé pour appliquer la mise à jour.')
  }
}

run().catch(console.error)
