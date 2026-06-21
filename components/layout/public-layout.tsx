import { ReactNode } from 'react';
import Link from 'next/link';
import { Footer } from './footer';
import { StoreStatus } from '../store-status';
import { PageTransition } from './page-transition';
import { Store } from 'lucide-react';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-[#FFF7ED]">
      <header className="w-full h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Store className="w-5 h-5 text-[#C96A3D]" />
          <Link href="/" className="font-bold text-[#C96A3D] text-[17px] sm:text-lg">Jajanan Pasar</Link>
          <StoreStatus isOpen={true} className="hidden sm:inline-flex ml-2" />
        </div>
        <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#C96A3D]">Masuk</Link>
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
