import { LoadingShell } from '@/components/layout/loading-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <LoadingShell>
      <div className="flex flex-col text-center py-6 sm:py-10 px-0 space-y-12 animate-in fade-in duration-500">
        <section className="flex flex-col items-center space-y-5 pt-4 px-4 w-full">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px]" />
          <Skeleton className="h-10 sm:h-12 w-full max-w-[320px] sm:max-w-md rounded-lg" />
          <Skeleton className="h-4 sm:h-5 w-full max-w-[280px] sm:max-w-sm rounded" />
          <div className="pt-2">
            <Skeleton className="h-12 w-[220px] sm:w-[260px] rounded-full" />
          </div>
        </section>
        
        <section className="px-4 text-left w-full mx-auto max-w-3xl">
          <Skeleton className="h-6 w-32 mx-auto mb-5 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
             <Skeleton className="h-[120px] w-full rounded-[16px]" />
             <Skeleton className="h-[120px] w-full rounded-[16px]" />
             <Skeleton className="h-[120px] w-full rounded-[16px]" />
             <Skeleton className="h-[120px] w-full rounded-[16px]" />
          </div>
        </section>
      </div>
    </LoadingShell>
  );
}
