import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { onboardingSchema } from '@/lib/validators/onboarding'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const result = onboardingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      classLevel,
      specialties,
      academicGoal,
      postBacTarget,
      schoolId,
      schoolName,
      isVisibleOnSchool,
    } = result.data

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        class_level: classLevel,
        specialties,
        academic_goal: academicGoal,
        post_bac_target: postBacTarget,
        school_id: schoolId || null,
        school_name: schoolName || null,
        is_visible_on_school: isVisibleOnSchool,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du profil' },
        { status: 500 }
      )
    }

    // Auto-join specialty channels and school channel
    // Find relevant channels
    const channelQueries = []
    if (specialties.length > 0) {
      channelQueries.push(
        supabase
          .from('chat_channels')
          .select('id')
          .in('subject_tag', specialties)
      )
    }
    if (schoolId) {
      channelQueries.push(
        supabase
          .from('chat_channels')
          .select('id')
          .eq('school_id', schoolId)
      )
    }

    const queryResults = await Promise.all(channelQueries)
    const channelIds: string[] = []
    queryResults.forEach((res) => {
      if (res.data) {
        res.data.forEach((c: { id: string }) => channelIds.push(c.id))
      }
    })

    if (channelIds.length > 0) {
      const memberships = channelIds.map((cid) => ({
        channel_id: cid,
        user_id: user.id,
        role: 'member',
      }))
      await supabase
        .from('channel_members')
        .upsert(memberships, { onConflict: 'channel_id,user_id' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
