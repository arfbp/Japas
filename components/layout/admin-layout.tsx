import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './user-menu';
import { redirect } from 'next/navigation';
import { PageTransition } from './page-transition';
import { AdminNav } from './admin-nav';

export async function AdminLayout({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-gray-50">
        <header className="w-full h-14 sm:h-16 bg-gray-900 text-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <AdminNav />
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl px-4 md:px-8 py-6 flex items-center justify-center">
          <PageTransition>
            <p className="text-gray-500">Sistem tidak tersedia.</p>
          </PageTransition>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  if (profile?.role !== 'admin') {
    redirect('/katalog');
  }

  return (
    <div className="min-h-[100dvh] flex flex-col flex-1 items-center bg-gray-50 w-full">
      <header className="w-full h-14 sm:h-16 bg-gray-900 text-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <AdminNav />
        </div>
        <UserMenu profile={profile} email={user?.email!} />
      </header>
      
      <main className="flex-1 w-full max-w-7xl px-4 md:px-8 py-6">
        <PageTransition className="flex-1 flex flex-col w-full">
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
