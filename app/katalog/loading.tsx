import { LoadingShell } from '@/components/layout/loading-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <LoadingShell>
      <div className="space-y-4 animate-in fade-in duration-500 p-4">
        <Skeleton className="h-12 w-full rounded-[12px]" />
        <div className="flex gap-2">
          <Skeleton className="h-[34px] w-20 rounded-full" />
          <Skeleton className="h-[34px] w-24 rounded-full" />
          <Skeleton className="h-[34px] w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="flex gap-3 p-3 bg-white rounded-[12px] border border-orange-50 shadow-sm">
               <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-[8px]" />
               <div className="flex-1 space-y-2 py-1">
                 <Skeleton className="h-4 w-3/4 rounded" />
                 <Skeleton className="h-3 w-1/2 rounded" />
                 <Skeleton className="h-4 w-24 rounded" />
               </div>
             </div>
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
