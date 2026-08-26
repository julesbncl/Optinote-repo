// Génération de code de parrainage : alphabet restreint aux caractères non
// ambigus (pas de 0/O ni 1/I/L) pour rester lisible/copiable sans erreur.
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const REFERRAL_CODE_LENGTH = 7

export function generateReferralCode(): string {
  let code = ''
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_ALPHABET[Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)]
  }
  return code
}
