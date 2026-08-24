import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Charger .env.local
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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Liste blanche des utilisateurs réels à préserver absolument
const PROTECTED_EMAILS = [
  'julesbonicemo@gmail.com',
  'julesbonicel@icloud.com',
  'julesbonicel1@gmail.com',
  'flobonicel@gmail.com',
]

// Noms ou motifs de faux profils / bots à purger
const BOT_NAME_PATTERNS = [
  'Léa M.',
  'Yanis K.',
  'Inès B.',
  'Mamadou D.',
  'Camille R.',
  'Lucas P.',
  'Thomas Dubois',
]

const BOT_EMAIL_PATTERNS = [
  'thomas.dubois@lycee.fr',
  '@test.com',
  '@example.com',
  '@mock.com',
  '@bot.optinote.fr',
]

async function cleanDatabase() {
  console.log('🧹 [1/4] Récupération des utilisateurs auth et profils Supabase...\n')

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs auth:', authError)
    process.exit(1)
  }

  const { data: profiles, error: profError } = await supabase.from('profiles').select('*')
  if (profError) {
    console.error('❌ Erreur lors de la récupération des profils:', profError)
    process.exit(1)
  }

  console.log(`📊 Utilisateurs Auth trouvés : ${authData.users.length}`)
  console.log(`📊 Profils trouvés : ${profiles.length}\n`)

  const realUserIds = new Set(authData.users.map((u) => u.id))

  // 2. Supprimer les profils orphelins ou bots
  console.log('🔍 [2/4] Analyse des profils à supprimer...')
  let deletedProfilesCount = 0

  for (const p of profiles) {
    const isProtected = PROTECTED_EMAILS.includes(p.email?.toLowerCase())
    if (isProtected) {
      console.log(`  🛡️ Compte réel protégé : ${p.email} (${p.full_name || 'Sans nom'})`)
      continue
    }

    const isOrphan = !realUserIds.has(p.id)
    const isBotName = p.full_name && BOT_NAME_PATTERNS.some((bot) => p.full_name.includes(bot))
    const isBotEmail = p.email && BOT_EMAIL_PATTERNS.some((pat) => p.email.includes(pat))

    if (isOrphan || isBotName || isBotEmail) {
      console.log(`  🗑️ Suppression du profil fictif : id=${p.id} email=${p.email} name=${p.full_name}`)
      const { error: delError } = await supabase.from('profiles').delete().eq('id', p.id)
      if (delError) {
        console.error(`     ❌ Erreur suppression profil ${p.id}:`, delError)
      } else {
        deletedProfilesCount++
      }
    }
  }

  // 3. Supprimer les utilisateurs Auth fictifs (si existants)
  console.log('\n🔍 [3/4] Analyse des comptes auth.users...')
  let deletedAuthUsersCount = 0

  for (const u of authData.users) {
    const email = u.email?.toLowerCase() || ''
    const isProtected = PROTECTED_EMAILS.includes(email)
    if (isProtected) {
      continue
    }

    const isBotEmail = BOT_EMAIL_PATTERNS.some((pat) => email.includes(pat))
    if (isBotEmail) {
      console.log(`  🗑️ Suppression du compte auth.users fictif : id=${u.id} email=${u.email}`)
      const { error: delAuthErr } = await supabase.auth.admin.deleteUser(u.id)
      if (delAuthErr) {
        console.error(`     ❌ Erreur suppression auth ${u.id}:`, delAuthErr)
      } else {
        deletedAuthUsersCount++
      }
    }
  }

  // 4. Nettoyage des messages & amitiés orphelines
  console.log('\n🧹 [4/4] Nettoyage des relations orphelines...')
  await supabase.from('friendships').delete().not('user_id', 'in', `(${Array.from(realUserIds).join(',')})`)
  await supabase.from('friendships').delete().not('friend_id', 'in', `(${Array.from(realUserIds).join(',')})`)

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(`✅ Nettoyage terminé avec succès !`)
  console.log(`- Profils fictifs supprimés : ${deletedProfilesCount}`)
  console.log(`- Utilisateurs auth fictifs supprimés : ${deletedAuthUsersCount}`)
  console.log(`- Tous les comptes réels sont conservés :`)
  PROTECTED_EMAILS.forEach((e) => console.log(`   ✨ ${e}`))
  console.log('═══════════════════════════════════════════════════════════════\n')
}

cleanDatabase().catch(console.error)
