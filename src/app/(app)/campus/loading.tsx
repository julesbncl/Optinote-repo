import { Skeleton } from '@/components/ui/Skeleton'

export default function CampusLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="h-[480px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
