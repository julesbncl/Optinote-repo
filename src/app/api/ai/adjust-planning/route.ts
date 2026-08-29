import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS, AI_DAILY_LIMITS } from '@/lib/constants'
import { isUserSubscribed } from '@/lib/stripe/server'
import { checkDailyAIQuota } from '@/lib/utils/quotas'
import { z } from 'zod'

const planSlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  subject: z.string(),
  task: z.string(),
  type: z.enum(['study', 'class', 'break', 'other']),
  activity: z.string().optional(),
})

const adjustPlanningSchema = z.object({
  prompt: z.string().min(3).max(500),
  currentPlan: z.array(planSlotSchema).max(200).optional().default([]),
  weekStart: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!isUserSubscribed(profile)) {
      return NextResponse.json(
        {
          error:
            'Le Planning Intelligent IA est réservé aux membres abonnés. Passez à l’abonnement Mensuel ou Annuel pour ajuster votre planning avec l’IA !',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }

    const rateLimit = await checkRateLimit(`ai:adjust-planning:${user.id}`, RATE_LIMITS.AI_CALLS_PER_MINUTE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const dailyQuota = await checkDailyAIQuota(
      supabase,
      user.id,
      ['adjust_planning'],
      AI_DAILY_LIMITS.ADJUST_PLANNING_PER_DAY
    )
    if (!dailyQuota.allowed) {
      return NextResponse.json({ error: dailyQuota.reason }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const parsedBody = adjustPlanningSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Veuillez préciser votre demande d’ajustement (ex: Sport tous les soirs 19h30-20h).' },
        { status: 400 }
      )
    }
    const { prompt, currentPlan } = parsedBody.data
    const weekStart = parsedBody.data.weekStart || new Date().toISOString().split('T')[0]

    const cleanPrompt = prompt.trim()
    let newSlots: Array<{
      day: number
      startTime: string
      endTime: string
      subject: string
      task: string
      type: 'study' | 'class' | 'break' | 'other'
      activity?: string
    }> = []

    // 1. Appel OpenAI pour interprétation intelligente en langage naturel
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAIClient()
        const systemPrompt = `Tu es le moteur IA d'OptiNote, l'assistant d'emploi du temps pour lycéens.
L'utilisateur veut ajuster son emploi du temps hebdomadaire avec une consigne en langage naturel (ex: "Ajoute une séance de sport tous les soirs de 19h30 à 20h", "Ajoute révision maths mardi à 18h", etc.).
La semaine est numérotée de 0 à 6 :
0 = Lundi, 1 = Mardi, 2 = Mercredi, 3 = Jeudi, 4 = Vendredi, 5 = Samedi, 6 = Dimanche.

Les types autorisés sont :
- 'other' : pour le sport, loisirs, musique, rendez-vous, sorties
- 'study' : pour les révisions, devoirs, cours particuliers, exercices
- 'class' : pour les cours officiels du lycée
- 'break' : pour les pauses et détente

Renvoie STRICTEMENT un objet JSON valide avec la liste des nouveaux créneaux à insérer :
{
  "slots": [
    {
      "day": 0,
      "startTime": "19:30",
      "endTime": "20:00",
      "subject": "Sport",
      "task": "Séance de sport quotidienne",
      "type": "other",
      "activity": "Sport"
    }
  ],
  "summary": "Explication courte de l'ajustement effectué en 1 phrase"
}`

        const userMessage = `Demande de l'utilisateur : "${cleanPrompt}"
Planning actuel : ${JSON.stringify(currentPlan.slice(0, 30))}

Génère les créneaux correspondant exactement à sa demande.`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        })

        const rawContent = completion.choices[0]?.message?.content?.trim()
        if (rawContent) {
          const parsed = JSON.parse(rawContent)
          if (parsed && Array.isArray(parsed.slots)) {
            // Ne garde que les créneaux dont la forme est exactement celle attendue :
            // une réponse IA malformée ne doit jamais corrompre le planning enregistré.
            const validatedSlots = parsed.slots
              .map((slot: unknown) => planSlotSchema.safeParse(slot))
              .filter((r: ReturnType<typeof planSlotSchema.safeParse>) => r.success)
              .map((r: { success: true; data: z.infer<typeof planSlotSchema> }) => r.data)
            if (validatedSlots.length > 0) {
              newSlots = validatedSlots
            }
          }
        }

        await supabase.from('ai_usage').insert({
          user_id: user.id,
          action_type: 'adjust_planning',
          tokens_used: completion.usage?.total_tokens || 0,
        })
      } catch (err: unknown) {
        console.error('OpenAI adjust planning error, fallback to parser:', err instanceof Error ? err.message : String(err))
      }
    }

    // 2. Parser local robuste en fallback si l'IA distante ne renvoie pas
    if (newSlots.length === 0) {
      const lower = cleanPrompt.toLowerCase()

      // Détection des heures
      let startTime = '19:30'
      let endTime = '20:00'
      const timeMatch = lower.match(/(\d{1,2})[h:](\d{2})?\s*(?:à|au|-)?\s*(\d{1,2})[h:](\d{2})?/)
      if (timeMatch) {
        const startH = String(parseInt(timeMatch[1])).padStart(2, '0')
        const startM = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00'
        const endH = String(parseInt(timeMatch[3])).padStart(2, '0')
        const endM = timeMatch[4] ? String(timeMatch[4]).padStart(2, '0') : '00'
        startTime = `${startH}:${startM}`
        endTime = `${endH}:${endM}`
      }

      // Détection des jours
      let daysToAdd: number[] = []
      if (lower.includes('tous les soirs') || lower.includes('chaque jour') || lower.includes('tous les jours') || lower.includes('7j/7')) {
        daysToAdd = [0, 1, 2, 3, 4, 5, 6]
      } else if (lower.includes('semaine') || lower.includes('lundi au vendredi')) {
        daysToAdd = [0, 1, 2, 3, 4]
      } else if (lower.includes('week-end') || lower.includes('weekend')) {
        daysToAdd = [5, 6]
      } else {
        if (lower.includes('lundi')) daysToAdd.push(0)
        if (lower.includes('mardi')) daysToAdd.push(1)
        if (lower.includes('mercredi')) daysToAdd.push(2)
        if (lower.includes('jeudi')) daysToAdd.push(3)
        if (lower.includes('vendredi')) daysToAdd.push(4)
        if (lower.includes('samedi')) daysToAdd.push(5)
        if (lower.includes('dimanche')) daysToAdd.push(6)
      }

      if (daysToAdd.length === 0) {
        daysToAdd = [0, 1, 2, 3, 4] // Par défaut du lundi au vendredi
      }

      // Détection du sujet & type
      let subject = 'Séance planifiée'
      let type: 'study' | 'class' | 'break' | 'other' = 'other'
      let activity = 'Sport'

      if (lower.includes('sport') || lower.includes('course') || lower.includes('muscu') || lower.includes('fitness') || lower.includes('foot') || lower.includes('tennis')) {
        subject = 'Sport'
        type = 'other'
        activity = 'Sport'
      } else if (lower.includes('math')) {
        subject = 'Mathématiques'
        type = 'study'
      } else if (lower.includes('physique') || lower.includes('chimie')) {
        subject = 'Physique-Chimie'
        type = 'study'
      } else if (lower.includes('philo')) {
        subject = 'Philosophie'
        type = 'study'
      } else if (lower.includes('pause') || lower.includes('goûter') || lower.includes('détente')) {
        subject = 'Pause'
        type = 'break'
      } else if (lower.includes('musique') || lower.includes('piano') || lower.includes('guitare')) {
        subject = 'Musique'
        type = 'other'
        activity = 'Musique'
      }

      newSlots = daysToAdd.map((day) => ({
        day,
        startTime,
        endTime,
        subject,
        task: cleanPrompt,
        type,
        activity: type === 'other' ? activity : undefined,
      }))
    }

    // 3. Fusionner les nouveaux créneaux avec le planning existant
    // Supprimer les éventuels doublons exacts sur le même jour/heure
    const updatedPlan = [...currentPlan]

    newSlots.forEach((newSlot) => {
      const existingIdx = updatedPlan.findIndex(
        (s) => s.day === newSlot.day && s.startTime === newSlot.startTime
      )
      if (existingIdx !== -1) {
        updatedPlan[existingIdx] = newSlot
      } else {
        updatedPlan.push(newSlot)
      }
    })

    // Trier les créneaux par jour puis par heure de début
    updatedPlan.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      return a.startTime.localeCompare(b.startTime)
    })

    // 4. Sauvegarder dans Supabase si l'utilisateur est connecté
    if (user) {
      const { error: saveError } = await supabase.from('schedules').upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          generated_plan: updatedPlan,
          status: 'active',
        },
        { onConflict: 'user_id,week_start' }
      )
      if (saveError) {
        console.error('Error saving adjusted planning:', saveError)
      }
    }

    return NextResponse.json({
      success: true,
      addedCount: newSlots.length,
      plan: updatedPlan,
      newSlots,
      message: `${newSlots.length} créneau(x) ajouté(s) et synchronisé(s) à votre planning ! ✨`,
    })
  } catch (error: unknown) {
    console.error('Error adjusting planning with AI:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l’ajustement de l’emploi du temps.' },
      { status: 500 }
    )
  }
}
