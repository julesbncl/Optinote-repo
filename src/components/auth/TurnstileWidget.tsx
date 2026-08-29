'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
}

// Widget anti-bot Cloudflare Turnstile. Ne s'affiche que si
// NEXT_PUBLIC_TURNSTILE_SITE_KEY est configurée — sans quoi le formulaire
// reste utilisable normalement (voir src/lib/turnstile.ts, qui laisse aussi
// passer côté serveur si la clé secrète associée n'est pas configurée).
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | undefined>(undefined)
    const [scriptLoaded, setScriptLoaded] = useState(false)

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
    }))

    useEffect(() => {
      if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) return

      const container = containerRef.current
      const turnstile = window.turnstile
      widgetIdRef.current = turnstile.render(container, {
        sitekey: siteKey,
        size: 'flexible',
        callback: onVerify,
        'expired-callback': () => onExpire?.(),
        'error-callback': () => onExpire?.(),
      })

      return () => {
        if (widgetIdRef.current) {
          turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = undefined
        }
      }
      // onVerify/onExpire are stable enough here (defined inline in the parent's
      // submit handler dependencies aren't needed) — only re-render on script load.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptLoaded, siteKey])

    if (!siteKey) return null

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={() => setScriptLoaded(true)}
        />
        <div ref={containerRef} className="w-full flex justify-center" />
      </>
    )
  }
)
