import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_CHANNELS = [
  { id: '22222222-2222-2222-2222-222222222201', name: '📐 Spécialité Mathématiques', description: 'Entraide, démonstrations et révisions de spé Maths', type: 'subject', subject_tag: 'maths' },
  { id: '22222222-2222-2222-2222-222222222202', name: '⚡ Spécialité Physique-Chimie', description: 'Formules, TP et méthode pour les exercices de Physique', type: 'subject', subject_tag: 'physique' },
  { id: '22222222-2222-2222-2222-222222222203', name: '🧬 Spécialité SVT', description: 'Schémas bilans, génétique et révisions SVT', type: 'subject', subject_tag: 'svt' },
  { id: '22222222-2222-2222-2222-222222222204', name: '📈 Spécialité SES', description: 'Économie, sociologie et fiches de notions', type: 'subject', subject_tag: 'ses' },
  { id: '22222222-2222-2222-2222-222222222205', name: '💻 Spécialité NSI & Info', description: 'Python, algo, structures de données et projets', type: 'subject', subject_tag: 'nsi' },
  { id: '22222222-2222-2222-2222-222222222206', name: '🏛️ Spécialité HGGSP', description: 'Histoire, géopolitique et relations internationales', type: 'subject', subject_tag: 'hggsp' },
  { id: '22222222-2222-2222-2222-222222222207', name: '✍️ Spécialité HLP & Philo', description: 'Dissertations, repères et citations philosophiques', type: 'subject', subject_tag: 'hlp' },
  { id: '22222222-2222-2222-2222-222222222208', name: '🎯 Objectif Bac 2026 (Général)', description: 'Grand Oral, calendrier des épreuves et entraide collective', type: 'general', subject_tag: 'bac' },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ channels: DEFAULT_CHANNELS })
    }

    const { data: channels, error } = await supabase
      .from('chat_channels')
      .select('*, schools(name, city)')
      .order('created_at', { ascending: true })

    if (error || !channels || channels.length === 0) {
      return NextResponse.json({ channels: DEFAULT_CHANNELS })
    }

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ channels: DEFAULT_CHANNELS })
  }
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

    const body = await request.json()
    const { name, description, isPrivate } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Le nom du groupe doit comporter au moins 3 caractères' }, { status: 400 })
    }

    const { data: channel, error } = await supabase
      .from('chat_channels')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        type: 'study_group',
        created_by: user.id,
        is_private: !!isPrivate,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la création du groupe' }, { status: 500 })
    }

    // Add creator as admin
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id,
      role: 'admin',
    })

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
