import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPlanningReminderEmail } from '@/lib/email'
import { getMotivationalMessage, getGoalLabel } from '@/lib/motivation'
import { calculateWeightedAverage } from '@/lib/utils'
import type { PlanningSlot } from '@/types/database'

// Tâche planifiée (Vercel Cron, voir vercel.json) : envoie chaque matin un e-mail
// de rappel du planning du jour à tous les utilisateurs qui ont activé cette
// notification. Protégée par CRON_SECRET pour empêcher tout déclenchement externe.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, full_name, post_bac_target, current_streak')
    .eq('email_notif_planning_reminder', true)
    .not('email', 'is', null)

  if (error || !profiles) {
    console.error('Error fetching profiles for planning reminder cron:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des profils' }, { status: 500 })
  }

  // Convention PlanningSlot : 0 = Lundi ... 6 = Dimanche (aligné sur getDay() décalé de -1)
  const todayIndex = (new Date().getDay() + 6) % 7

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const profile of profiles) {
    if (!profile.email) {
      skipped++
      continue
    }

    try {
      const [{ data: schedule }, { data: grades }] = await Promise.all([
        admin
          .from('schedules')
          .select('generated_plan')
          .eq('user_id', profile.id)
          .eq('status', 'active')
          .maybeSingle(),
        admin.from('grades').select('value, out_of, coefficient').eq('user_id', profile.id),
      ])

      const todaySlots = ((schedule?.generated_plan as PlanningSlot[]) || [])
        .filter((slot) => slot.day === todayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((s) => ({ startTime: s.startTime, endTime: s.endTime, subject: s.subject, task: s.task }))

      const average =
        grades && grades.length > 0
          ? calculateWeightedAverage(
              grades.map((g) => ({ value: g.value, outOf: g.out_of, coefficient: g.coefficient }))
            )
          : null

      const { greeting, phrase, averageLine } = getMotivationalMessage({
        name: profile.full_name,
        average,
        goalLabel: getGoalLabel(profile.post_bac_target),
        streak: profile.current_streak || 0,
      })

      const result = await sendPlanningReminderEmail(profile.email, {
        greeting,
        motivationPhrase: phrase,
        averageLine,
        streak: profile.current_streak || 0,
        slots: todaySlots,
      })

      if (result.success) {
        sent++
      } else {
        failed++
        console.warn(`[Planning Reminder Cron] Échec envoi à ${profile.email}: ${result.error}`)
      }
    } catch (err) {
      failed++
      console.error(`[Planning Reminder Cron] Exception pour ${profile.email}:`, err)
    }
  }

  return NextResponse.json({ success: true, total: profiles.length, sent, failed, skipped })
}
