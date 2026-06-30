import { Suspense } from 'react';
import LoginForm from './login-form';
import { PublicLayout } from '@/components/layout/public-layout';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  let storeName = 'Jajanan Pasar';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: storeSettings } = await supabase.from('store_settings').select('store_name').eq('singleton_key', true).single();
    if (storeSettings?.store_name) {
      storeName = storeSettings.store_name;
    }
  }

  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center flex-1 w-full p-4 min-h-[60vh]">
        <div className="w-full max-w-[340px] rounded-[16px] bg-white p-6 sm:p-8 shadow-sm border border-orange-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Masuk</h1>
            <p className="text-sm text-gray-500 mt-1.5">Selamat datang kembali di {storeName}</p>
          </div>
          <Suspense fallback={<div className="h-[46px] border rounded-[12px] bg-gray-50 animate-pulse"></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
