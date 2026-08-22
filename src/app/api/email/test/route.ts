import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendWelcomeEmail, sendTestEmail, sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('Erreur API Email:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
