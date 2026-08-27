'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types/database'

interface AppProfileContextValue {
  userId: string | null
  profile: Profile | null
  profileLoading: boolean
}

// Le layout (app) a déjà vérifié la session et chargé le profil une fois en
// entrant dans l'appli. Ce contexte évite à chaque page (Dashboard, Campus,
// Planning...) de refaire son propre appel supabase.auth.getUser() — un
// aller-retour réseau bloquant vers le serveur d'auth — à chaque changement
// d'onglet, alors que l'utilisateur est déjà connu.
const AppProfileContext = createContext<AppProfileContextValue>({
  userId: null,
  profile: null,
  profileLoading: true,
})

export const AppProfileProvider = AppProfileContext.Provider

export function useAppProfile() {
  return useContext(AppProfileContext)
}
