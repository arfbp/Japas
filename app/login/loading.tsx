import { LoadingShell } from '@/components/layout/loading-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
  return (
    <LoadingShell>
      <div className="flex flex-col items-center justify-center flex-1 w-full p-4 min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-full max-w-[340px] rounded-[16px] bg-white p-6 sm:p-8 shadow-sm border border-orange-100 flex flex-col items-center">
          <div className="flex flex-col items-center mb-6 space-y-3 w-full">
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-[46px] w-full rounded-[12px]" />
        </div>
      </div>
    </LoadingShell>
  );
}
