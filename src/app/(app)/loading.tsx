import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="pt-6 flex flex-col gap-4" aria-busy>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-4xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-3xl" />
    </div>
  );
}
