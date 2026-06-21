import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CompleteProfileForm from './complete-profile-form';
import { PublicLayout } from '@/components/layout/public-layout';

export default async function CompleteProfilePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
           <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <span className="text-2xl">⏳</span>
           </div>
           <h1 className="text-2xl font-bold text-gray-900">Sedang Mempersiapkan Layanan</h1>
           <p className="text-gray-500">Silakan coba kembali beberapa saat lagi.</p>
        </div>
      </PublicLayout>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .single();

  if (profile?.phone_number) {
    redirect('/');
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-sm border border-orange-100">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Lengkapi Profil</h1>
            <p className="text-sm text-gray-500 mt-1">Masukkan nomor WhatsApp Anda untuk melanjutkan pesanan.</p>
          </div>
          <CompleteProfileForm />
        </div>
      </div>
    </PublicLayout>
  );
}
