import { School as SchoolIcon, Users, MapPin, ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { School } from '@/types/campus'

interface SchoolCardProps {
  school: School
  onJoinChannel?: (school: School) => void
  onSetUserSchool?: (school: School) => void
  isUserSchool?: boolean
}

export function SchoolCard({
  school,
  onJoinChannel,
  onSetUserSchool,
  isUserSchool,
}: SchoolCardProps) {
  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        isUserSchool
          ? 'bg-emerald-50/40 border-emerald-300/80 ring-1 ring-emerald-500/20'
          : 'bg-surface border-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isUserSchool
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-primary-50 text-primary-600'
            }`}
          >
            <SchoolIcon className="h-4.5 w-4.5" />
          </div>
          {isUserSchool ? (
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Ton Lycée</span>
            </span>
          ) : (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-tertiary border border-border">
              {school.academy || 'Académie'}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-sm text-text-primary leading-snug">
          {school.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
          <MapPin className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
          <span>
            {school.city} ({school.postal_code})
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200/60">
            {school.academy || 'Lycée Général & Techno'}
          </span>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-border/80 space-y-1.5">
        {!isUserSchool && onSetUserSchool && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSetUserSchool(school)
            }}
            className="w-full justify-center text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xs gap-1.5 cursor-pointer h-8"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Rejoindre ce lycée et rendre mon profil public</span>
          </Button>
        )}

        {onJoinChannel && (
          <Button
            size="sm"
            variant={isUserSchool ? 'primary' : 'outline'}
            className="w-full justify-between text-xs font-bold h-7.5"
            onClick={(e) => {
              e.stopPropagation()
              onJoinChannel(school)
            }}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            <span>Rejoindre le salon</span>
          </Button>
        )}
      </div>
    </div>
  )
}
