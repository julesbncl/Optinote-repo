import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOpenAIClient } from '@/lib/ai/openai'
import { PROMPTS } from '@/lib/ai/prompts'
import { safeParseAIJson } from '@/lib/ai/json-parser'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS, AI_DAILY_LIMITS } from '@/lib/constants'
import { checkDailyAIQuota } from '@/lib/utils/quotas'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BUCKET = 'school-certificates'
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

interface CertificateAnalysis {
  isSchoolCertificate: boolean
  extractedName: string | null
  extractedSchool: string | null
  nameMatches: boolean
  schoolMatches: boolean
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(`verify-certificate:${user.id}`, RATE_LIMITS.AI_CALLS_PER_MINUTE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const dailyQuota = await checkDailyAIQuota(
      supabase,
      user.id,
      ['verify_certificate'],
      AI_DAILY_LIMITS.VERIFY_CERTIFICATE_PER_DAY
    )
    if (!dailyQuota.allowed) {
      return NextResponse.json({ error: dailyQuota.reason }, { status: 429 })
    }

    const body = await request.json()
    const filePath = typeof body.filePath === 'string' ? body.filePath : null
    if (!filePath || !filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Fichier invalide' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, school_name')
      .eq('id', user.id)
      .single()

    const declaredName = profile?.full_name || ''
    const declaredSchool = profile?.school_name || null

    // Télécharge le fichier depuis Supabase Storage (respecte la RLS : l'utilisateur
    // ne peut lire que son propre dossier)
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from(BUCKET)
      .download(filePath)

    if (downloadErr || !fileBlob) {
      console.error('Error downloading certificate for analysis:', downloadErr)
      return NextResponse.json({ error: 'Impossible de lire le document transmis' }, { status: 500 })
    }

    const extension = filePath.split('.').pop()?.toLowerCase() || ''
    const isImage = IMAGE_EXTENSIONS.has(extension)

    let analysis: CertificateAnalysis | null = null

    if (isImage && process.env.OPENAI_API_KEY) {
      try {
        const arrayBuffer = await fileBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = extension === 'jpg' ? 'jpeg' : extension
        const dataUrl = `data:image/${mimeType};base64,${base64}`

        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPTS.verifySchoolCertificate(declaredName, declaredSchool) },
                { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content?.trim()
        analysis = raw ? safeParseAIJson<CertificateAnalysis>(raw) : null

        await supabase.from('ai_usage').insert({
          user_id: user.id,
          action_type: 'verify_certificate',
          tokens_used: completion.usage?.total_tokens || 0,
        })
      } catch (aiErr: unknown) {
        console.error('Certificate vision analysis failed:', aiErr instanceof Error ? aiErr.message : String(aiErr))
        analysis = null
      }
    }

    // Détermine le statut final. Les PDF (non analysables par la vision IA) et les
    // cas où l'IA n'a pas pu conclure clairement passent en attente de vérification
    // manuelle plutôt que d'être bloqués ou validés à tort.
    let verificationStatus: 'pending' | 'verified' | 'rejected' = 'pending'
    let isVerified = false
    let verificationNote = analysis?.reason || null

    if (!analysis) {
      verificationStatus = 'pending'
      verificationNote = isImage
        ? 'Analyse automatique indisponible, vérification manuelle nécessaire.'
        : 'Document PDF reçu, vérification manuelle nécessaire.'
    } else if (
      analysis.isSchoolCertificate &&
      analysis.nameMatches &&
      analysis.schoolMatches &&
      analysis.confidence !== 'low'
    ) {
      verificationStatus = 'verified'
      isVerified = true
    } else if (!analysis.isSchoolCertificate && analysis.confidence !== 'low') {
      // Document clairement autre chose qu'un certificat de scolarité (carte
      // d'identité, passeport, bulletin...) : refusé explicitement, l'utilisateur
      // peut réessayer avec le bon document.
      verificationStatus = 'rejected'
    } else {
      verificationStatus = 'pending'
    }

    // Écriture via la clé de service : verification_status/is_verified sont
    // protégés en base contre toute modification directe par un utilisateur
    // authentifié (voir migration 023) — seule cette route, après l'analyse
    // IA ci-dessus, peut les changer.
    const admin = createAdminClient()
    const { data: updatedProfile, error: updateErr } = await admin
      .from('profiles')
      .update({
        school_certificate_url: filePath,
        verification_status: verificationStatus,
        is_verified: isVerified,
        verification_note: verificationNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateErr) {
      console.error('Error updating verification status:', updateErr)
      return NextResponse.json({ error: 'Erreur lors de l’enregistrement du statut' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: verificationStatus,
      isVerified,
      note: verificationNote,
      profile: updatedProfile,
    })
  } catch (error: unknown) {
    console.error('Certificate verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la vérification du certificat' },
      { status: 500 }
    )
  }
}
