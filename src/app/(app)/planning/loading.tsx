import { Skeleton } from '@/components/ui/Skeleton'

export default function PlanningLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
