import { LoadingShell } from '@/components/layout/loading-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompleteProfileLoading() {
  return (
    <LoadingShell>
      <div className="flex flex-col items-center justify-center flex-1 w-full p-4 min-h-[70vh] animate-in fade-in duration-500">
        <div className="w-full max-w-md rounded-[16px] bg-white p-6 sm:p-8 shadow-sm border border-orange-100 flex flex-col">
          <div className="flex flex-col mb-6 space-y-3">
            <Skeleton className="h-7 w-40 rounded" />
            <Skeleton className="h-4 w-[280px] rounded" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-10 w-full rounded-[10px]" />
            </div>
            <Skeleton className="h-9 w-full rounded-[10px]" />
          </div>
        </div>
      </div>
    </LoadingShell>
  );
}
