import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { simulateAverageSchema } from '@/lib/validators/grades'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

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
    const rateLimit = checkRateLimit(`sim:${user.id || ip}`, 30, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de simulations demandées. Veuillez patienter.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = simulateAverageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données de simulation invalides' },
        { status: 400 }
      )
    }

    const { trimester, simulatedGrades, targetAverage } = parsed.data

    // Récupération sécurisée et paramétrée des matières et notes réelles existantes
    const [subjectsRes, existingGradesRes] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, name, coefficient')
        .eq('user_id', user.id),
      supabase
        .from('grades')
        .select('id, subject_id, value, out_of, coefficient, is_simulated')
        .eq('user_id', user.id)
        .eq('trimester', trimester)
        .eq('is_simulated', false),
    ])

    if (subjectsRes.error || existingGradesRes.error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des données scolaires' },
        { status: 500 }
      )
    }

    const subjects = subjectsRes.data || []
    const existingGrades = existingGradesRes.data || []

    // Calcul sécurisé des moyennes par matière
    const subjectAverages = subjects.map((sub) => {
      const realSubGrades = existingGrades.filter((g) => g.subject_id === sub.id)
      const simSubGrades = simulatedGrades.filter((g) => g.subjectId === sub.id)

      let totalPoints = 0
      let totalCoeff = 0

      realSubGrades.forEach((g) => {
        const normalizedValue = (g.value / (g.out_of || 20)) * 20
        const coeff = g.coefficient || 1
        totalPoints += normalizedValue * coeff
        totalCoeff += coeff
      })

      simSubGrades.forEach((g) => {
        const normalizedValue = (g.value / (g.outOf || 20)) * 20
        const coeff = g.coefficient || 1
        totalPoints += normalizedValue * coeff
        totalCoeff += coeff
      })

      const average = totalCoeff > 0 ? totalPoints / totalCoeff : null

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        coefficient: sub.coefficient,
        average: average !== null ? Math.round(average * 100) / 100 : null,
        gradeCount: realSubGrades.length + simSubGrades.length,
      }
    })

    // Calcul de la moyenne générale
    let totalGeneralPoints = 0
    let totalGeneralCoeff = 0

    subjectAverages.forEach((sa) => {
      if (sa.average !== null) {
        totalGeneralPoints += sa.average * sa.coefficient
        totalGeneralCoeff += sa.coefficient
      }
    })

    const overallAverage =
      totalGeneralCoeff > 0
        ? Math.round((totalGeneralPoints / totalGeneralCoeff) * 100) / 100
        : null

    return NextResponse.json({
      success: true,
      data: {
        trimester,
        overallAverage,
        subjectAverages,
        targetAverage: targetAverage ?? null,
        gapToTarget:
          targetAverage !== undefined && overallAverage !== null
            ? Math.round((overallAverage - targetAverage) * 100) / 100
            : null,
      },
    })
  } catch (err: any) {
    console.error('Erreur API simulation moyennes:', err)
    return NextResponse.json(
      { error: 'Erreur interne lors de la simulation' },
      { status: 500 }
    )
  }
}
