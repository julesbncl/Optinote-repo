import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Suppression définitive du compte (droit à l'effacement, RGPD art. 17).
// Annule d'abord tout abonnement Stripe actif (sinon l'utilisateur continuerait
// à être facturé après suppression, sans plus aucun moyen de le gérer), puis
// supprime l'utilisateur Auth — profiles.id référence auth.users(id) ON DELETE
// CASCADE, donc toutes les données liées (notes, fiches, planning, amis,
// messages...) sont supprimées automatiquement avec lui.
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (
      profile?.stripe_customer_id &&
      ['active', 'trialing'].includes(profile.subscription_status || '')
    ) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 10,
        })
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (err) {
        console.error('Error cancelling Stripe subscription before account deletion:', err)
        return NextResponse.json(
          { error: 'Erreur lors de la résiliation de ton abonnement. Contacte-nous avant de réessayer.' },
          { status: 500 }
        )
      }
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Error deleting user account:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression du compte' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in account deletion:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
