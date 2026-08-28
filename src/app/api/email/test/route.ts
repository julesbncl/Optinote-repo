import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendWelcomeEmail, sendTestEmail, sendVerificationEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

// Outil de diagnostic Resend réservé aux administrateurs : sans cette garde,
// n'importe qui pourrait utiliser ce endpoint comme relais pour envoyer des
// e-mails arbitraires (type "custom") depuis le domaine optinote.fr —
// risque de spam, d'abus et de dégradation de la réputation d'envoi.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return Boolean(profile?.is_admin)
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const { to, type = 'test', name, subject, message, verificationUrl } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Le champ "to" (adresse email destinataire) est requis' },
        { status: 400 }
      )
    }

    let result

    if (type === 'verify') {
      result = await sendVerificationEmail(to, {
        name,
        verificationUrl: verificationUrl || `https://optinote.fr/auth/confirm?token=demo-secure-token-${Date.now()}`,
      })
    } else if (type === 'welcome') {
      result = await sendWelcomeEmail(to, name)
    } else if (type === 'custom') {
      if (!subject || !message) {
        return NextResponse.json(
          { error: 'Les champs "subject" et "message" sont requis pour un email personnalisé' },
          { status: 400 }
        )
      }
      result = await sendEmail({
        to,
        subject,
        html: `<div style="font-family: sans-serif; padding: 20px;">${message}</div>`,
      })
    } else {
      // Par défaut : email de test
      result = await sendTestEmail(to)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error, latencyMs: result.latencyMs }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Email envoyé avec succès à ${to} via Resend depuis OptiNote <contact@optinote.fr> ! 🚀`,
      messageId: result.messageId,
      latencyMs: result.latencyMs,
    })
  } catch (error: unknown) {
    console.error('Erreur API Email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
