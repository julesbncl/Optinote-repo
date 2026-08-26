'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface EvolutionPoint {
  date: string
  average: number
}

interface GradeEvolutionModalProps {
  isOpen: boolean
  onClose: () => void
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function GradeEvolutionModal({ isOpen, onClose }: GradeEvolutionModalProps) {
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<EvolutionPoint[]>([])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/grades/evolution')
      .then((r) => (r.ok ? r.json() : { points: [] }))
      .then((data) => setPoints(data.points || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  const chartData = points.map((p) => ({ label: formatDateLabel(p.date), average: p.average }))
  const first = points[0]?.average
  const last = points[points.length - 1]?.average
  const trend = first !== undefined && last !== undefined ? last - first : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Évolution de ta moyenne générale" size="lg">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : points.length < 2 ? (
        <div className="py-8 text-center text-xs text-text-tertiary">
          Pas encore assez de notes pour tracer une évolution. Ajoute au moins deux notes réelles
          pour voir apparaître ta courbe de progression.
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
              trend > 0.05
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : trend < -0.05
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-surface-secondary text-text-tertiary border-border'
            }`}
          >
            {trend > 0.05 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : trend < -0.05 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span>
              {trend > 0.05 ? '+' : ''}
              {trend.toFixed(2)} pt depuis la première note
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  domain={[0, 20]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  formatter={(value) => [`${value}/20`, 'Moyenne']}
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4F46E5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-text-tertiary text-center">
            Moyenne pondérée cumulée après chaque note réelle ajoutée (hors simulations).
          </p>
        </div>
      )}
    </Modal>
  )
}
