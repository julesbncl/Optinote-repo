import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Droit à la portabilité des données (RGPD art. 20) : exporte l'ensemble des
// données personnelles de l'utilisateur connecté en JSON téléchargeable.
// Utilise le client authentifié normal (pas la clé de service) : la RLS
// garantit que seules SES propres données sont accessibles.
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const [
      profile,
      subjects,
      grades,
      folders,
      revisionSheets,
      schedules,
      generatedMessages,
      friendships,
      messages,
      studySessions,
      referrals,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('grades').select('*').eq('user_id', user.id),
      supabase.from('folders').select('*').eq('user_id', user.id),
      supabase.from('revision_sheets').select('*').eq('user_id', user.id),
      supabase.from('schedules').select('*').eq('user_id', user.id),
      supabase.from('generated_messages').select('*').eq('user_id', user.id),
      supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
      supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase.from('study_sessions').select('*').eq('host_id', user.id),
      supabase.from('referrals').select('*').or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      subjects: subjects.data || [],
      grades: grades.data || [],
      folders: folders.data || [],
      revision_sheets: revisionSheets.data || [],
      schedules: schedules.data || [],
      generated_messages: generatedMessages.data || [],
      friendships: friendships.data || [],
      messages: messages.data || [],
      study_sessions_hosted: studySessions.data || [],
      referrals: referrals.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="optinote-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error('Error exporting account data:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
