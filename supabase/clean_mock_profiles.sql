-- ═══════════════════════════════════════════════════════════════
-- Script de Nettoyage Définitif : Faux Profils & Utilisateurs Bots
-- OptiNote — Supabase Database Cleaner
-- ═══════════════════════════════════════════════════════════════

-- 1. Nettoyage des messages envoyés par ou vers des bots / faux comptes
DELETE FROM public.messages
WHERE sender_id NOT IN (SELECT id FROM auth.users)
   OR (receiver_id IS NOT NULL AND receiver_id NOT IN (SELECT id FROM auth.users));

-- 2. Nettoyage des relations d'amitié orphelines ou factices
DELETE FROM public.friendships
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR friend_id NOT IN (SELECT id FROM auth.users);

-- 3. Nettoyage des profils orphelins (sans compte auth.users associé)
-- SAUVEGARDE STRICTE : Ne jamais toucher aux vrais comptes (notamment julesbonicemo@gmail.com)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users)
  AND email != 'julesbonicemo@gmail.com';

-- 4. Nettoyage des faux comptes dans auth.users (si des bots ont été générés avec des domaines de test)
DELETE FROM auth.users
WHERE (
  email LIKE '%@test.com'
  OR email LIKE '%@example.com'
  OR email LIKE '%@mock.com'
  OR email LIKE '%@bot.optinote.fr'
  OR email LIKE '%thomas.dubois@lycee.fr'
  OR email LIKE '%lea.m@%'
  OR email LIKE '%yanis.k@%'
  OR email LIKE '%ines.b@%'
  OR email LIKE '%mamadou.d@%'
)
AND email NOT IN (
  'julesbonicemo@gmail.com',
  'julesbonicel@icloud.com',
  'julesbonicel1@gmail.com',
  'flobonicel@gmail.com'
);

-- 5. Nettoyage des profils associés aux bots supprimés ci-dessus
DELETE FROM public.profiles
WHERE (
  email LIKE '%@test.com'
  OR email LIKE '%@example.com'
  OR email LIKE '%@mock.com'
  OR email LIKE '%@bot.optinote.fr'
  OR email LIKE '%thomas.dubois@lycee.fr'
  OR email LIKE '%lea.m@%'
  OR email LIKE '%yanis.k@%'
  OR email LIKE '%ines.b@%'
  OR email LIKE '%mamadou.d@%'
  OR full_name IN ('Léa M.', 'Yanis K.', 'Inès B.', 'Mamadou D.', 'Camille R.', 'Lucas P.', 'Thomas Dubois')
)
AND email NOT IN (
  'julesbonicemo@gmail.com',
  'julesbonicel@icloud.com',
  'julesbonicel1@gmail.com',
  'flobonicel@gmail.com'
);
