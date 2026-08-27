-- Liste d'attente publique (formulaire marketing TikTok) + accès Beta temporaire
-- accordé à tous les inscrits via un code partagé, actif uniquement les 30-31 août
-- 2026 (48h avant le lancement du 1er septembre).

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  class_level text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Formulaire public : n'importe qui (même déconnecté) peut s'inscrire. Personne ne
-- peut lire la table depuis le client — seul le serveur (clé service) y accède,
-- pour les stats et l'éventuelle relance email au lancement.
create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

alter table public.profiles
  add column if not exists beta_access_redeemed_at timestamptz;
