import { z } from 'zod'

export const onboardingSchema = z.object({
  classLevel: z.enum(['seconde', 'premiere', 'terminale', 'autre'], {
    message: 'Veuillez sélectionner votre niveau scolaire',
  }),
  specialties: z.array(z.string()).default([]),
  academicGoal: z.enum(['excellence', 'progression', 'bac_mention', 'rattrapage'], {
    message: 'Veuillez sélectionner un objectif académique',
  }),
  postBacTarget: z.enum(
    ['scientifique', 'sante', 'eco_droit', 'litteraire', 'ingenieur', 'art', 'autre'],
    { message: 'Veuillez sélectionner votre horizon post-bac' }
  ),
  schoolId: z.string().uuid().nullable().optional(),
  schoolName: z.string().max(150).nullable().optional(),
  isVisibleOnSchool: z.boolean().default(true),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
