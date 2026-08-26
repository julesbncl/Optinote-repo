import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateWeightedAverage } from '@/lib/utils'

// Historique de l'évolution de la moyenne générale, calculé à la volée à partir
// des notes réelles existantes (aucune table dédiée) : pour chaque note, classée
// chronologiquement, on recalcule la moyenne pondérée cumulée de toutes les notes
// jusqu'à cette date incluse — ce qui dessine la progression réelle dans le temps.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const [{ data: subjects }, { data: grades }] = await Promise.all([
      supabase.from('subjects').select('id, coefficient').eq('user_id', user.id),
      supabase
        .from('grades')
        .select('value, out_of, coefficient, subject_id, date, is_simulated')
        .eq('user_id', user.id)
        .eq('is_simulated', false)
        .order('date', { ascending: true }),
    ])

    const subjectCoefById = new Map((subjects || []).map((s) => [s.id, s.coefficient]))
    const validGrades = (grades || []).filter((g) => g.date)

    const points: { date: string; average: number }[] = []
    const running: { value: number; outOf: number; coefficient: number }[] = []

    for (const g of validGrades) {
      running.push({
        value: g.value,
        outOf: g.out_of,
        coefficient: g.coefficient * (subjectCoefById.get(g.subject_id) || 1),
      })
      const avg = calculateWeightedAverage(running)
      if (avg !== null) {
        points.push({ date: g.date as string, average: avg })
      }
    }

    return NextResponse.json({ points })
  } catch (err) {
    console.error('Error computing grade evolution:', err)
    return NextResponse.json({ points: [] })
  }
}
