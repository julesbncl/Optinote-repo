// ═══════════════════════════════════════════════════════════════
// Script de Vérification Globale OptiNote
// ═══════════════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'

console.log('🚀 Démarrage de la vérification globale OptiNote...\n')

let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`)
    passed++
  } else {
    console.error(`  ❌ [FAIL] ${testName}`)
    failed++
  }
}

const rootDir = process.cwd()

// 1. Vérification des fichiers d'environnement
console.log('1️⃣  Vérification de la configuration & environnement...')
const envLocalExists = fs.existsSync(path.join(rootDir, '.env.local'))
const envExampleExists = fs.existsSync(path.join(rootDir, '.env.example'))
assert(envLocalExists || envExampleExists, 'Fichier de configuration (.env.local ou .env.example) présent')

const envFile = envLocalExists ? '.env.local' : '.env.example'
const envContent = fs.readFileSync(path.join(rootDir, envFile), 'utf8')
assert(envContent.includes('NEXT_PUBLIC_SUPABASE_URL='), 'NEXT_PUBLIC_SUPABASE_URL configuré')
assert(envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY='), 'NEXT_PUBLIC_SUPABASE_ANON_KEY configuré')
assert(envContent.includes('OPENAI_API_KEY='), 'OPENAI_API_KEY configuré')
assert(envContent.includes('STRIPE_PRICE_ID='), 'STRIPE_PRICE_ID configuré (price_1U6SrGrWM4B48KwBLvdM5LSU)')
assert(envContent.includes('STRIPE_PRICE_ID_ANNUAL='), 'STRIPE_PRICE_ID_ANNUAL configuré (price_1U7H5KRwM4B48KWbDoLCFGzq)')
assert(envContent.includes('STRIPE_SECRET_KEY='), 'STRIPE_SECRET_KEY configuré')
assert(envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='), 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configuré')

// 2. Vérification des routes de l'application
console.log('\n2️⃣  Vérification des routes et des pages...')
const essentialPages = [
  'src/app/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/campus/page.tsx',
  'src/app/(app)/campus/map/page.tsx',
  'src/app/(app)/campus/messages/page.tsx',
  'src/app/(app)/grades/page.tsx',
  'src/app/(app)/planning/page.tsx',
  'src/app/(app)/revision/page.tsx',
  'src/app/(app)/settings/page.tsx',
]

essentialPages.forEach((file) => {
  assert(fs.existsSync(path.join(rootDir, file)), `Page ${file} existe`)
})

// 3. Vérification des routes API Stripe & Auth
console.log('\n3️⃣  Vérification des routes API Stripe & Auth...')
const essentialApis = [
  'src/app/api/stripe/checkout/route.ts',
  'src/app/api/stripe/webhook/route.ts',
  'src/app/api/auth/subscribe/route.ts',
  'src/app/api/campus/schools/route.ts',
  'src/app/api/campus/schools/search/route.ts',
  'src/app/api/campus/schools/select/route.ts',
  'src/app/api/campus/channels/route.ts',
  'src/app/api/campus/messages/route.ts',
  'src/app/api/campus/friends/route.ts',
  'src/app/api/campus/users/location/route.ts',
  'src/app/api/ai/scanner/route.ts',
]

essentialApis.forEach((file) => {
  assert(fs.existsSync(path.join(rootDir, file)), `Route API ${file} existe`)
})

// 4. Vérification de la logique de verrouillage Pro sur la carte
console.log('\n4️⃣  Vérification de la logique de restriction Pro (Campus Map)...')
const campusMapContent = fs.readFileSync(path.join(rootDir, 'src/app/(app)/campus/map/page.tsx'), 'utf8')
assert(campusMapContent.includes('isPro'), 'Détection du statut isPro dans la page carte')
assert(campusMapContent.includes('PaywallModal'), 'PaywallModal intégré pour les utilisateurs non-Pro')
assert(campusMapContent.includes('SchoolMap'), 'Composant SchoolMap intégré pour les utilisateurs Pro')

// 5. Vérification du Webhook Stripe pour is_pro
console.log('\n5️⃣  Vérification de la synchronisation is_pro dans Stripe Webhook...')
const webhookContent = fs.readFileSync(path.join(rootDir, 'src/app/api/stripe/webhook/route.ts'), 'utf8')
assert(webhookContent.includes('is_pro: true') || webhookContent.includes('is_pro: isActive'), 'Mise à jour is_pro: true lors de l’activation d’un abonnement')
assert(webhookContent.includes('is_pro: false'), 'Révocation is_pro: false lors de l’annulation d’un abonnement')

// 6. Vérification du Middleware d'authentification
console.log('\n6️⃣  Vérification du Middleware Supabase...')
const middlewareContent = fs.readFileSync(path.join(rootDir, 'src/lib/supabase/middleware.ts'), 'utf8')
assert(middlewareContent.includes('protectedPaths'), 'Protection des routes privées configurée')
assert(middlewareContent.includes('/login'), 'Redirection automatique vers /login')

console.log(`\n═══════════════════════════════════════════════════════════════`)
console.log(`Résultats : ${passed} passés, ${failed} échoués.`)
if (failed === 0) {
  console.log(`🎉 Toutes les vérifications sont validées avec succès !`)
  process.exit(0)
} else {
  console.error(`⚠️ Certaines vérifications ont échoué.`)
  process.exit(1)
}
