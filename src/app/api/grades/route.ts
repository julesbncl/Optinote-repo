import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGradeSchema, createSubjectSchema } from '@/lib/validators/grades'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// ═════════════════════════════════════════════════════════
// GET: Récupérer les matières et notes de l'utilisateur
// ═════════════════════════════════════════════════════════
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const [subjectsRes, gradesRes] = await Promise.all([
      supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('grades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
    ])

    if (subjectsRes.error || gradesRes.error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subjects: subjectsRes.data || [],
      grades: gradesRes.data || [],
    })
  } catch (err: any) {
    console.error('Erreur API Grades GET:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════
// POST: Créer une nouvelle note avec validation Zod stricte
// ═════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const ip = getClientIp(request as any)
    const rateLimit = checkRateLimit(`grade_post:${user.id || ip}`, 60, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = createGradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données de la note invalides' },
        { status: 400 }
      )
    }

    const { subjectId, value, outOf, coefficient, label, trimester, date, isSimulated } = parsed.data

    // Requête paramétrée vers Supabase PostgreSQL
    const { data, error } = await supabase
      .from('grades')
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        value,
        out_of: outOf,
        coefficient,
        label: label ? label.trim() : null,
        trimester,
        date: date || new Date().toISOString(),
        is_simulated: isSimulated,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur insertion grade:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l’enregistrement de la note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, grade: data }, { status: 201 })
  } catch (err: any) {
    console.error('Erreur API Grades POST:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
