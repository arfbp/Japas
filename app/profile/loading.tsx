import { LoadingShell } from '@/components/layout/loading-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <LoadingShell>
      <div className="max-w-2xl mx-auto space-y-8 w-full p-4 animate-in fade-in duration-500">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-40 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="bg-white rounded-[16px] shadow-sm border border-orange-100 p-6 space-y-6">
           <div className="space-y-2">
             <Skeleton className="h-4 w-24 rounded" />
             <Skeleton className="h-10 w-full rounded-[10px]" />
           </div>
           <div className="space-y-2">
             <Skeleton className="h-4 w-32 rounded" />
             <Skeleton className="h-10 w-full rounded-[10px]" />
           </div>
           <div className="space-y-2">
             <Skeleton className="h-4 w-40 rounded" />
             <Skeleton className="h-10 w-full rounded-[10px]" />
           </div>
           <div className="pt-2">
             <Skeleton className="h-9 w-36 rounded-[10px]" />
           </div>
        </div>
      </div>
    </LoadingShell>
  );
}
