import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'
import { PROMPTS } from '@/lib/ai/prompts'
import { generateRevisionSchema } from '@/lib/validators/revision'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'
import { checkRevisionSheetQuota } from '@/lib/utils/quotas'

import { safeParseAIJson } from '@/lib/ai/json-parser'

export const maxDuration = 60 // 60s timeout

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // 2. Fetch profile & check quota for free tier (max 1 sheet)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const quotaCheck = await checkRevisionSheetQuota(supabase, user.id, profile)
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error:
              quotaCheck.reason ||
              'Limite de la version gratuite atteinte (1 fiche maximum). Passez à l’abonnement illimité pour continuer !',
            code: 'UPGRADE_REQUIRED',
            quota: 'revision_sheet',
          },
          { status: 403 }
        )
      }

      // 3. Rate limit
      const rateLimit = checkRateLimit(
        `ai:revision:${user.id}`,
        RATE_LIMITS.AI_CALLS_PER_MINUTE
      )
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
          { status: 429 }
        )
      }
    }

    // 4. Validate
    const body = await request.json()
    const result = generateRevisionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { text: rawText, subjectHint } = result.data
    const text = rawText
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // 5. Call OpenAI if available with 20s timeout safeguard
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAIClient()

        // 20s timeout promise safeguard
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI timeout after 20s')), 20000)
        )

        const completionPromise = openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: PROMPTS.generateRevision(text, subjectHint),
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        })

        const completion = await Promise.race([completionPromise, timeoutPromise])

        const rawResponse = completion.choices[0]?.message?.content?.trim()
        if (rawResponse) {
          const parsed = safeParseAIJson(rawResponse)
          if (parsed && (parsed.content || parsed.title)) {
            if (user) {
              await supabase.from('ai_usage').insert({
                user_id: user.id,
                action_type: 'generate_revision',
                tokens_used: completion.usage?.total_tokens || 0,
              })
            }
            return NextResponse.json({
              title: parsed.title || (subjectHint ? `Synthèse : ${subjectHint}` : 'Fiche de Révision'),
              subject: parsed.subject || subjectHint || 'Général',
              summary: parsed.summary || 'Synthèse des notions et formules clés du cours.',
              keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : ['Notions Fondamentales', 'Formules Clés'],
              content: parsed.content || text,
              flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
            })
          }
        }
      } catch (aiErr: any) {
        console.error('OpenAI generate revision failed, using structured fallback:', aiErr?.message)
      }
    }

    // 6. Intelligent Fallback
    const fallbackSheet = {
      title: subjectHint ? `Synthèse : ${subjectHint}` : 'Fiche de Révision Synthétique',
      subject: subjectHint || 'Général',
      summary: 'Fiche condensée des définitions fondamentales, théorèmes clés et méthodes indispensables pour réussir les évaluations.',
      keyConcepts: [
        'Définitions & Notations Fondamentales',
        'Théorèmes & Propriétés Essentielles',
        'Méthode & Réflexes pour les DS',
        'Erreurs Fréquentes à Éviter',
      ],
      content: `## 1. 📌 Résumé Express & Contexte\nSynthèse des points clés et formules :\n${text.slice(0, 400)}\n\n---\n\n## 2. 🔑 Définitions & Formules Clés\n- **Notion principale** : Comprendre la structure du calcul et le domaine de validité.\n- **Application directe** : Identifier les hypothèses de départ et appliquer la formule avec rigueur.\n\n---\n\n## 3. 🎯 Points Essentiels & Pièges au Bac\n- Vérifier la cohérence des unités et des signes.\n- Toujours encadrer le résultat final et expliciter les étapes intermédiaires.`,
      flashcards: [
        { question: 'Quel est l’objectif principal de cette notion ?', answer: 'Maîtriser les définitions et savoir appliquer les formules en évaluation.' },
        { question: 'Quel est le premier réflexe méthodologique ?', answer: 'Vérifier les conditions d’application avant de démarrer les calculs.' }
      ]
    }

    return NextResponse.json(fallbackSheet)
  } catch (error: any) {
    console.error('Generate revision error:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération de la fiche.' },
      { status: 500 }
    )
  }
}
