import { BLOCKED_KEYWORDS } from './dictionary'

export interface ModerationResult {
  isSafe: boolean
  flagReason?: string
  cleanedContent: string
}

/**
 * Filtre les messages en temps réel pour protéger les mineurs contre le harcèlement et les insultes.
 */
export function moderateMessage(text: string): ModerationResult {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(normalized)) {
      return {
        isSafe: false,
        flagReason: 'Contenu inapproprié ou potentiellement offensant détecté',
        cleanedContent: text.replace(new RegExp(keyword, 'gi'), '***'),
      }
    }
  }

  return {
    isSafe: true,
    cleanedContent: text,
  }
}
