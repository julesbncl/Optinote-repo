import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'
import { PROMPTS } from '@/lib/ai/prompts'
import { generateRevisionSchema } from '@/lib/validators/revision'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS, AI_DAILY_LIMITS } from '@/lib/constants'
import { checkRevisionSheetQuota, checkDailyAIQuota } from '@/lib/utils/quotas'

import { safeParseAIJson } from '@/lib/ai/json-parser'

export const maxDuration = 60 // 60s timeout

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

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
    const rateLimit = await checkRateLimit(
      `ai:revision:${user.id}`,
      RATE_LIMITS.AI_CALLS_PER_MINUTE
    )
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    // 3bis. Daily quota (indépendant du statut d'abonnement)
    const dailyQuota = await checkDailyAIQuota(
      supabase,
      user.id,
      ['generate_revision'],
      AI_DAILY_LIMITS.GENERATE_REVISION_PER_DAY
    )
    if (!dailyQuota.allowed) {
      return NextResponse.json({ error: dailyQuota.reason }, { status: 429 })
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
            await supabase.from('ai_usage').insert({
              user_id: user.id,
              action_type: 'generate_revision',
              tokens_used: completion.usage?.total_tokens || 0,
            })
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
      } catch (aiErr: unknown) {
        console.error('OpenAI generate revision failed, using structured fallback:', aiErr instanceof Error ? aiErr.message : String(aiErr))
      }
    }

    // 6. Intelligent Fallback (strict extraction from text)
    const rawLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const firstLine = rawLines[0] || ''
    const fallbackTitle = subjectHint ? `Synthèse : ${subjectHint}` : firstLine.replace(/^[#*-\d.]+\s*/, '').slice(0, 60) || 'Fiche de Révision'
    const fallbackSummary = rawLines.slice(0, 3).join(' ').slice(0, 220) || 'Synthèse des notions et données du document.'

    const fallbackSheet = {
      title: fallbackTitle,
      subject: subjectHint || 'Général',
      summary: fallbackSummary,
      keyConcepts: [
        subjectHint || 'Notion Fondamentale',
        'Définitions du Texte',
        'Propriétés Clés',
        'Points Essentiels',
      ],
      content: `## 1. 📌 Résumé des Points Clés\n${fallbackSummary}\n\n---\n\n## 2. 🔑 Définitions & Notions Fondamentales du Texte\n${rawLines.slice(0, 4).map((l) => `- **Point clé** : ${l}`).join('\n')}\n\n---\n\n## 3. ⚡ Formules, Propriétés & Données Clés\n${rawLines.slice(4, 8).map((l) => `- ${l}`).join('\n') || '- Données et propriétés extraites du cours.'}\n\n---\n\n## 4. 🎯 Points Essentiels & Distinctions à Retenir\n- Maîtriser les définitions et propriétés énoncées ci-dessus.`,
      flashcards: [
        {
          question: `Quelle est la notion centrale de ${fallbackTitle} ?`,
          answer: fallbackSummary.slice(0, 160),
        },
        {
          question: `Quels sont les points clés définis dans ce texte ?`,
          answer: rawLines.slice(0, 2).join(' ').slice(0, 160) || 'Définitions et propriétés du document.',
        },
      ],
    }

    return NextResponse.json(fallbackSheet)
  } catch (error: unknown) {
    console.error('Generate revision error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération de la fiche.' },
      { status: 500 }
    )
  }
}
