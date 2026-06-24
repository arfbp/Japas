import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { Toaster } from '@/components/ui/sonner';
import { GlobalAnnouncements } from '@/components/global-announcements';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Jajanan Pasar',
  description: 'Platform pemesanan kue jajanan pasar',
};

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
