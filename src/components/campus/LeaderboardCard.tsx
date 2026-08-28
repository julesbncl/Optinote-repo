'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Flame, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  full_name: string
  avatar_url: string | null
  value: number
  isMe: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardCard() {
  const [type, setType] = useState<'streak' | 'average'>('streak')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Réinitialise le chargement pendant le rendu à chaque changement d'onglet
  // (plutôt qu'un setState synchrone dans l'effect), qui ne garde alors que le
  // fetch asynchrone lui-même.
  const [prevType, setPrevType] = useState(type)
  if (type !== prevType) {
    setPrevType(type)
    setLoading(true)
  }

  useEffect(() => {
    fetch(`/api/campus/leaderboard?type=${type}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [type])

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-xs p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5 sm:gap-2">
          <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
          <span>Classement entre amis</span>
        </h2>
      </div>

      {/* Onglets Streak / Moyenne — grands boutons tactiles, pleine largeur sur mobile */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setType('streak')}
          className={`h-9 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            type === 'streak'
              ? 'bg-orange-500 text-white shadow-2xs'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Série</span>
        </button>
        <button
          type="button"
          onClick={() => setType('average')}
          className={`h-9 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            type === 'average'
              ? 'bg-primary-600 text-white shadow-2xs'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Moyenne</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-surface-secondary animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-4 text-center text-[10.5px] text-text-tertiary bg-surface-secondary/40 rounded-xl border border-dashed border-border px-3 space-y-1.5">
          <p>Aucun classement disponible pour le moment.</p>
          <p className="text-[9.5px]">
            Active le classement dans{' '}
            <Link href="/settings" className="text-primary-600 font-bold underline">
              Paramètres
            </Link>{' '}
            et invite tes amis à faire de même.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.slice(0, 10).map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                entry.isMe
                  ? 'bg-primary-50/70 border-primary-200'
                  : 'bg-surface-secondary/50 border-border/80'
              }`}
            >
              <span className="w-5 flex-shrink-0 text-center text-xs font-black text-text-tertiary">
                {MEDALS[index] || index + 1}
              </span>
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary-600 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  entry.full_name[0]?.toUpperCase() || 'L'
                )}
              </div>
              <p className="flex-1 min-w-0 text-[11px] font-bold text-text-primary truncate">
                {entry.isMe ? 'Toi' : entry.full_name}
              </p>
              <span className="text-[11px] font-black text-text-primary flex-shrink-0">
                {type === 'streak' ? `🔥 ${entry.value}` : `${entry.value}/20`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
