import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { Toaster } from '@/components/ui/sonner';
import { GlobalAnnouncements } from '@/components/global-announcements';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('store_name').eq('singleton_key', true).single();
  const storeName = data?.store_name || 'Jajanan Pasar';
  return {
    title: storeName,
    description: `Platform pemesanan kue ${storeName}`,
  };
}

import { AuthSync } from '@/components/auth-sync';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#FFF7ED] text-gray-900 antialiased flex flex-col min-h-[100dvh]`} suppressHydrationWarning>
        <AuthSync />
        <GlobalAnnouncements />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
