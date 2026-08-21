import Link from 'next/link'
import { Users, BookOpen, School as SchoolIcon, Plus, ChevronRight, Lock } from 'lucide-react'
import type { ChatChannel } from '@/types/campus'

interface ChannelListProps {
  channels: ChatChannel[]
  activeChannelId?: string
  onCreateGroup?: () => void
}

export function ChannelList({ channels, activeChannelId, onCreateGroup }: ChannelListProps) {
  const subjectChannels = channels.filter((c) => c.type === 'subject')
  const generalChannels = channels.filter((c) => c.type === 'general')
  const schoolChannels = channels.filter((c) => c.type === 'school')
  const studyGroups = channels.filter((c) => c.type === 'study_group')

  return (
    <div className="space-y-3">
      {/* Salons Thématiques & Spécialités */}
      {subjectChannels.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[9.5px] font-extrabold text-text-tertiary uppercase tracking-wider px-1">
            Spécialités & Matières ({subjectChannels.length})
          </h4>
          <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5">
            {subjectChannels.map((channel) => {
              const isActive = activeChannelId === channel.id

              return (
                <Link
                  key={channel.id}
                  href={`/campus/channels/${channel.id}`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                      : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Salons Généraux */}
      {generalChannels.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[9.5px] font-extrabold text-text-tertiary uppercase tracking-wider px-1">
            Bac & Entraide Générale ({generalChannels.length})
          </h4>
          <div className="space-y-0.5 max-h-36 overflow-y-auto pr-0.5">
            {generalChannels.map((channel) => {
              const isActive = activeChannelId === channel.id

              return (
                <Link
                  key={channel.id}
                  href={`/campus/channels/${channel.id}`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                      : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-3.5 w-3.5 text-accent-500 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Salons de Lycée */}
      {schoolChannels.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[9.5px] font-extrabold text-text-tertiary uppercase tracking-wider px-1">
            Mon Lycée
          </h4>
          <div className="space-y-0.5">
            {schoolChannels.map((channel) => {
              const isActive = activeChannelId === channel.id

              return (
                <Link
                  key={channel.id}
                  href={`/campus/channels/${channel.id}`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                      : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SchoolIcon className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Groupes d'étude */}
      {studyGroups.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[9.5px] font-extrabold text-text-tertiary uppercase tracking-wider px-1">
            Mes Groupes Privés
          </h4>
          <div className="space-y-0.5 max-h-32 overflow-y-auto pr-0.5">
            {studyGroups.map((channel) => {
              const isActive = activeChannelId === channel.id

              return (
                <Link
                  key={channel.id}
                  href={`/campus/channels/${channel.id}`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                      : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
