import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-white/10">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-3 w-[200px]" />
      </div>
      <Skeleton className="h-8 w-[100px]" />
    </div>
  )
}
