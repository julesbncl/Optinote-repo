import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const email = searchParams.get('email')
  const redirectUrl = new URL(`${origin}/waiting-for-email`)
  if (email) {
    redirectUrl.searchParams.set('email', email)
  }
  return NextResponse.redirect(redirectUrl)
}
