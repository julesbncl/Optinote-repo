import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'
import { PROMPTS } from '@/lib/ai/prompts'
import { generateMessageSchema } from '@/lib/validators/planning'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'
import { isUserSubscribed } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Check active subscription (Messages Pro is a premium tool)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!isUserSubscribed(profile)) {
      return NextResponse.json(
        {
          error:
            'Le générateur de Messages Professeurs est réservé aux membres abonnés. Passez à l’abonnement Mensuel ou Annuel pour rédiger des messages parfaits !',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }

    // 3. Rate limit
    const rateLimit = checkRateLimit(
      `ai:message:${user.id}`,
      RATE_LIMITS.AI_CALLS_PER_MINUTE
    )
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    // 4. Validate input
    const body = await request.json()
    const result = generateMessageSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { messageType, context, teacherName, studentName } = result.data

    // 5. Call OpenAI
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: PROMPTS.generateMessage(
            messageType,
            context,
            teacherName,
            studentName
          ),
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) {
      return NextResponse.json(
        { error: "Aucune réponse de l'IA" },
        { status: 500 }
      )
    }

    // 6. Save to database
    await supabase.from('generated_messages').insert({
      user_id: user.id,
      message_type: messageType,
      context,
      teacher_name: teacherName || null,
      generated_content: message,
    })

    // 7. Track usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      action_type: 'generate_message',
      tokens_used: completion.usage?.total_tokens || 0,
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Generate message error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
