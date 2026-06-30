import { ShieldAlert } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { RedirectTimer } from './redirect-timer';

export default function ForbiddenPage() {
  return (
    <PublicLayout>
      <div className="flex flex-col flex-1 items-center justify-center p-4 min-h-[60vh]">
        <div className="flex flex-col items-center text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">403 Access Denied</h1>
          <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini. Mengalihkan ke beranda...</p>
        </div>
      </div>
      <RedirectTimer />
    </PublicLayout>
  );
}
