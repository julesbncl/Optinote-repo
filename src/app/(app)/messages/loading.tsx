import { Skeleton } from '@/components/ui/Skeleton'

export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[500px] rounded-xl" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    </div>
  )
}
