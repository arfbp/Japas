import { ReactNode } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './user-menu';
import { StoreStatus } from '../store-status';
import { Footer } from './footer';
import { PageTransition } from './page-transition';
import { Store } from 'lucide-react';

export async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-[#FFF7ED]">
        <header className="w-full h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <Store className="w-5 h-5 text-[#C96A3D]" />
            <Link href="/" className="font-bold text-[#C96A3D] text-[17px] sm:text-lg">Jajanan Pasar</Link>
            <StoreStatus isOpen={false} className="hidden sm:inline-flex ml-2" />
          </div>
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#C96A3D]">Masuk</Link>
        </header>
        <main className="flex-1 w-full max-w-7xl px-4 md:px-8 py-6">
          <PageTransition className="flex-1 flex flex-col w-full h-full">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
               <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">⏳</span>
               </div>
               <h1 className="text-2xl font-bold text-gray-900">Sedang Mempersiapkan Layanan</h1>
               <p className="text-gray-500">Silakan coba kembali beberapa saat lagi.</p>
            </div>
          </PageTransition>
        </main>
        <Footer />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: storeSettings } = await supabase.from('store_settings').select('store_name').eq('singleton_key', true).single();
  const storeName = storeSettings?.store_name || 'Jajanan Pasar';

  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-[#FFF7ED]">
      <header className="w-full h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Store className="w-5 h-5 text-[#C96A3D]" />
          <Link href="/" className="font-bold text-[#C96A3D] text-[17px] sm:text-lg">{storeName}</Link>
          <StoreStatus isOpen={true} className="hidden sm:inline-flex ml-2" />
        </div>
        {profile ? (
          <UserMenu profile={profile} email={user?.email!} />
        ) : (
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#C96A3D]">Masuk</Link>
        )}
      </header>
      <main className="flex-1 w-full max-w-7xl px-0 sm:px-4 flex flex-col md:px-8 py-0 sm:py-4 md:py-6">
        <PageTransition className="flex-1 flex flex-col w-full">
          {children}
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
