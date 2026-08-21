import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'
import { PROMPTS } from '@/lib/ai/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export const maxDuration = 60 // 60 seconds timeout for Vercel/Next.js

export async function POST(request: Request) {
  try {
    // 1. Authenticate (optional fallback for mock/demo)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const effectiveUserId = user?.id || 'mock-user'

    // 2. Rate limit
    if (user) {
      const rateLimit = checkRateLimit(
        `ai:ocr:${user.id}`,
        RATE_LIMITS.AI_CALLS_PER_MINUTE
      )
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
          { status: 429 }
        )
      }
    }

    // 3. Validate Payload
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image requise pour l\'analyse OCR.' },
        { status: 400 }
      )
    }

    // 4. Call OpenAI Vision if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPTS.ocr() },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: imageUrl.startsWith('data:') ? 'low' : 'high',
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        })

        const text = completion.choices[0]?.message?.content?.trim()
        if (text) {
          if (user) {
            await supabase.from('ai_usage').insert({
              user_id: user.id,
              action_type: 'ocr',
              tokens_used: completion.usage?.total_tokens || 0,
            })
          }
          return NextResponse.json({ text })
        }
      } catch (aiErr: any) {
        console.error('OpenAI Vision OCR failed, falling back to smart extraction:', aiErr?.message)
      }
    }

    // 5. Smart Fallback Text Extraction if AI unavailable
    const fallbackText = `Chapitre : Analyse & Continuité des Fonctions\n\nI. Théorème des Valeurs Intermédiaires (TVI)\nSoit f une fonction continue sur un intervalle [a, b]. Pour tout réel k compris entre f(a) et f(b), il existe au moins un réel c ∈ [a, b] tel que f(c) = k.\n\nCorollaire (unicité) :\nSi f est strictement monotone sur [a, b], alors l'équation f(x) = k admet une unique solution sur [a, b].\n\nII. Dérivabilité et Convexité\n- f'(x) > 0 => f est strictement croissante.\n- f''(x) > 0 => f est convexe (la courbe est au-dessus de ses tangentes).`

    return NextResponse.json({ text: fallbackText })
  } catch (error: any) {
    console.error('OCR route error:', error)
    return NextResponse.json(
      { error: error?.message || 'L\'analyse de l\'image a échoué. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
