// ═══════════════════════════════════════════════════════════════════════════════
// OptiNote — Référentiel Officiel des Programmes Scolaires & Coefficients
// Basé sur les grilles officielles de l'Éducation Nationale (Lycée Général)
// ═══════════════════════════════════════════════════════════════════════════════

export interface OfficialSubjectTemplate {
  name: string
  coefficient: number
  color: string
  category: 'tronc_commun' | 'specialite' | 'option'
  hoursPerWeek?: string
  description?: string
}

export interface SpecialtyOption {
  id: string
  name: string
  emoji: string
  color: string
  desc: string
}

export const OFFICIAL_SPECIALTIES: SpecialtyOption[] = [
  { id: 'maths', name: 'Mathématiques', emoji: '📐', color: '#6366F1', desc: 'Analyse, suites, géométrie & probabilités' },
  { id: 'physique', name: 'Physique-Chimie', emoji: '⚡', color: '#8B5CF6', desc: 'Mécanique, thermodynamique, chimie & ondes' },
  { id: 'svt', name: 'SVT', emoji: '🧬', color: '#10B981', desc: 'Génétique, géologie, climat & santé' },
  { id: 'ses', name: 'Sciences Économiques & Sociales (SES)', emoji: '📈', color: '#F59E0B', desc: 'Microéconomie, sociologie & marchés' },
  { id: 'hggsp', name: 'HGGSP', emoji: '🏛️', color: '#EC4899', desc: 'Histoire, géopolitique, puissance & frontières' },
  { id: 'hlp', name: 'Humanités, Littérature & Philo (HLP)', emoji: '✍️', color: '#84CC16', desc: 'Parole, pouvoir, histoire des idées' },
  { id: 'llcer', name: 'LLCER Anglais', emoji: '🌍', color: '#06B6D4', desc: 'Littérature, culture & civilisation anglophone' },
  { id: 'nsi', name: 'Numérique & Sciences Informatiques (NSI)', emoji: '💻', color: '#3B82F6', desc: 'Python, algorithmique, bases de données' },
  { id: 'si', name: 'Sciences de l’Ingénieur (SI)', emoji: '⚙️', color: '#64748B', desc: 'Systèmes mécatroniques & ingénierie' },
  { id: 'arts', name: 'Arts (Plastiques / Musique / Cinéma)', emoji: '🎨', color: '#D946EF', desc: 'Pratique artistique, analyse & histoire de l’art' },
  { id: 'biologie_ecologie', name: 'Biologie-Écologie', emoji: '🌿', color: '#059669', desc: 'Agrosystèmes, biodiversité & écologie' },
]

export const OPTIONAL_COURSES = {
  seconde: [
    { id: 'arts_sec', name: 'Option Arts (Plastiques / Musique)', coef: 2, color: '#D946EF' },
    { id: 'latin_sec', name: 'Langues de l’Antiquité (Latin / Grec)', coef: 2, color: '#F97316' },
    { id: 'lv3_sec', name: 'Langue Vivante C (LV3)', coef: 2, color: '#0EA5E9' },
    { id: 'eps_sec', name: 'EPS Renforcée', coef: 2, color: '#22C55E' },
  ],
  premiere: [
    { id: 'latin_prem', name: 'Langues de l’Antiquité (Latin / Grec)', coef: 2, color: '#F97316' },
    { id: 'arts_prem', name: 'Option Arts', coef: 2, color: '#D946EF' },
    { id: 'eps_prem', name: 'Option EPS', coef: 2, color: '#22C55E' },
    { id: 'lv3_prem', name: 'Langue Vivante C (LV3)', coef: 2, color: '#0EA5E9' },
  ],
  terminale: [
    { id: 'maths_expertes', name: 'Mathématiques Expertes (Option)', coef: 2, color: '#6366F1' },
    { id: 'maths_comp', name: 'Mathématiques Complémentaires (Option)', coef: 2, color: '#3B82F6' },
    { id: 'dgemc', name: 'Droit & Grands Enjeux (DGEMC)', coef: 2, color: '#EC4899' },
    { id: 'latin_term', name: 'Langues de l’Antiquité (Latin / Grec)', coef: 2, color: '#F97316' },
    { id: 'arts_term', name: 'Option Arts', coef: 2, color: '#D946EF' },
  ],
}

/**
 * Génère la liste complète des matières et coefficients officiels selon le niveau et les spécialités sélectionnées
 */
export function generateOfficialSubjects(config: {
  level: 'seconde' | 'premiere' | 'terminale'
  specialtyIds: string[]
  optionalIds: string[]
}): OfficialSubjectTemplate[] {
  const subjects: OfficialSubjectTemplate[] = []

  if (config.level === 'seconde') {
    // ═══════════════════════════════════════════════════════
    // SECONDE : Tronc Commun Officiel
    // ═══════════════════════════════════════════════════════
    subjects.push(
      { name: 'Français', coefficient: 5, color: '#6366F1', category: 'tronc_commun', hoursPerWeek: '4h' },
      { name: 'Mathématiques', coefficient: 5, color: '#3B82F6', category: 'tronc_commun', hoursPerWeek: '4h' },
      { name: 'Histoire-Géographie', coefficient: 3, color: '#EC4899', category: 'tronc_commun', hoursPerWeek: '3h' },
      { name: 'Physique-Chimie', coefficient: 4, color: '#8B5CF6', category: 'tronc_commun', hoursPerWeek: '3h' },
      { name: 'SVT', coefficient: 3, color: '#10B981', category: 'tronc_commun', hoursPerWeek: '1h30' },
      { name: 'Langue Vivante A (LVA)', coefficient: 3, color: '#06B6D4', category: 'tronc_commun', hoursPerWeek: '3h' },
      { name: 'Langue Vivante B (LVB)', coefficient: 3, color: '#F59E0B', category: 'tronc_commun', hoursPerWeek: '2h30' },
      { name: 'SES', coefficient: 2, color: '#84CC16', category: 'tronc_commun', hoursPerWeek: '1h30' },
      { name: 'SNT (Numérique)', coefficient: 2, color: '#64748B', category: 'tronc_commun', hoursPerWeek: '1h30' },
      { name: 'EPS', coefficient: 2, color: '#22C55E', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'EMC', coefficient: 1, color: '#A855F7', category: 'tronc_commun', hoursPerWeek: '0h30' }
    )

    // Options Seconde
    config.optionalIds.forEach((optId) => {
      const opt = OPTIONAL_COURSES.seconde.find((o) => o.id === optId)
      if (opt) {
        subjects.push({
          name: opt.name,
          coefficient: opt.coef,
          color: opt.color,
          category: 'option',
          hoursPerWeek: '3h',
        })
      }
    })
  } else if (config.level === 'premiere') {
    // ═══════════════════════════════════════════════════════
    // PREMIÈRE : Tronc Commun + 3 Spécialités (Coef 8)
    // ═══════════════════════════════════════════════════════
    subjects.push(
      { name: 'Français (Épreuve Anticipée)', coefficient: 5, color: '#6366F1', category: 'tronc_commun', hoursPerWeek: '4h' },
      { name: 'Histoire-Géographie', coefficient: 3, color: '#EC4899', category: 'tronc_commun', hoursPerWeek: '3h' },
      { name: 'Langue Vivante A (LVA)', coefficient: 3, color: '#06B6D4', category: 'tronc_commun', hoursPerWeek: '2h30' },
      { name: 'Langue Vivante B (LVB)', coefficient: 3, color: '#F59E0B', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'Enseignement Scientifique', coefficient: 3, color: '#10B981', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'EPS', coefficient: 2, color: '#22C55E', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'EMC', coefficient: 1, color: '#A855F7', category: 'tronc_commun', hoursPerWeek: '0h30' }
    )

    // 3 Spécialités de 1ère
    config.specialtyIds.forEach((specId) => {
      const spec = OFFICIAL_SPECIALTIES.find((s) => s.id === specId)
      if (spec) {
        subjects.push({
          name: `Spécialité ${spec.name}`,
          coefficient: 8,
          color: spec.color,
          category: 'specialite',
          hoursPerWeek: '4h',
          description: spec.desc,
        })
      }
    })

    // Options Première
    config.optionalIds.forEach((optId) => {
      const opt = OPTIONAL_COURSES.premiere.find((o) => o.id === optId)
      if (opt) {
        subjects.push({
          name: opt.name,
          coefficient: opt.coef,
          color: opt.color,
          category: 'option',
          hoursPerWeek: '3h',
        })
      }
    })
  } else if (config.level === 'terminale') {
    // ═══════════════════════════════════════════════════════
    // TERMINALE : Tronc Commun + 2 Spécialités Renforcées (Coef 16 chacune !)
    // ═══════════════════════════════════════════════════════
    subjects.push(
      { name: 'Philosophie (Épreuve Bac)', coefficient: 8, color: '#84CC16', category: 'tronc_commun', hoursPerWeek: '4h' },
      { name: 'Histoire-Géographie', coefficient: 3, color: '#EC4899', category: 'tronc_commun', hoursPerWeek: '3h' },
      { name: 'Langue Vivante A (LVA)', coefficient: 3, color: '#06B6D4', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'Langue Vivante B (LVB)', coefficient: 3, color: '#F59E0B', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'Enseignement Scientifique', coefficient: 3, color: '#10B981', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'EPS', coefficient: 2, color: '#22C55E', category: 'tronc_commun', hoursPerWeek: '2h' },
      { name: 'EMC', coefficient: 1, color: '#A855F7', category: 'tronc_commun', hoursPerWeek: '0h30' }
    )

    // 2 Spécialités Renforcées de Terminale (Coef 16 chacune au Baccalauréat !)
    config.specialtyIds.forEach((specId) => {
      const spec = OFFICIAL_SPECIALTIES.find((s) => s.id === specId)
      if (spec) {
        subjects.push({
          name: `Spécialité ${spec.name}`,
          coefficient: 16,
          color: spec.color,
          category: 'specialite',
          hoursPerWeek: '6h',
          description: spec.desc,
        })
      }
    })

    // Options Terminale
    config.optionalIds.forEach((optId) => {
      const opt = OPTIONAL_COURSES.terminale.find((o) => o.id === optId)
      if (opt) {
        subjects.push({
          name: opt.name,
          coefficient: opt.coef,
          color: opt.color,
          category: 'option',
          hoursPerWeek: '3h',
        })
      }
    })
  }

  return subjects
}
