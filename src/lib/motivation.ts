// Génère un message de motivation "Flash du matin", utilisé à la fois par le
// widget du Dashboard et par l'e-mail de rappel de planning. La phrase change
// chaque jour (rotation déterministe par jour de l'année) sans dépendre d'un
// appel IA, pour rester instantané et gratuit à générer.

export interface MotivationContext {
  name?: string | null
  average?: number | null
  goalLabel?: string | null
  streak?: number
}

export interface MotivationalMessage {
  greeting: string
  phrase: string
  averageLine: string | null
}

const DAILY_PHRASES: string[] = [
  "Chaque fiche relue aujourd'hui te rapproche un peu plus de ton objectif.",
  'La régularité bat le talent, quand le talent ne travaille pas assez régulièrement.',
  "Un quart d'heure de révision ciblée vaut mieux qu'une heure sans plan.",
  "Ton futur toi, le jour des résultats, te remerciera pour les efforts d'aujourd'hui.",
  "Le Bac se prépare une journée à la fois — aujourd'hui, c'est ton tour de jouer.",
  "Personne ne devient excellent du jour au lendemain, mais chaque jour t'en rapproche.",
  'Ouvre une seule fiche, et tu seras déjà en avance sur hier.',
  "La discipline d'aujourd'hui construit les résultats de demain.",
  'Un petit pas de révision vaut mieux que zéro pas.',
  "Tu n'as pas besoin d'une journée parfaite, juste d'une journée un peu meilleure qu'hier.",
]

export function getGoalLabel(postBacTarget?: string | null): string | null {
  switch (postBacTarget) {
    case 'ingenieur':
      return 'CPGE MPSI / Ingénieur 🚀'
    case 'sante':
      return 'PASS Médecine 🩺'
    case 'eco_droit':
      return 'Éco-Droit / Sciences Po 📈'
    case 'litteraire':
      return 'Filière Littéraire 📚'
    case 'art':
      return "Écoles d'Art 🎨"
    default:
      return 'Excellence Académique 🎓'
  }
}

function pickDailyPhrase(): string {
  const now = new Date()
  const dayOfYear = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), 0, 0)) /
      86400000
  )
  return DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length]
}

export function getMotivationalMessage({
  name,
  average,
  goalLabel,
  streak = 0,
}: MotivationContext): MotivationalMessage {
  const firstName = name?.split(' ')[0] || 'Champion'
  const phrase = pickDailyPhrase()

  const greeting =
    streak >= 2 ? `${firstName}, tu es sur une série de ${streak} jours 🔥` : `Bonjour ${firstName} 👋`

  const averageLine =
    average !== null && average !== undefined
      ? `Ta moyenne actuelle est de ${average}/20${goalLabel ? ` — objectif : ${goalLabel}` : ''}.`
      : null

  return { greeting, phrase, averageLine }
}
