'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart';
import { ShoppingCart } from 'lucide-react';

interface UserMenuProps {
  profile: any;
  email: string;
}

export function UserMenu({ profile, email }: UserMenuProps) {
  const router = useRouter();
  const cartItems = useCartStore((state) => (profile?.id ? state.itemsByUserId[profile.id] : undefined) || []);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      {profile?.role === 'admin' && (
        <Link href="/admin/orders" className="text-sm font-semibold text-[#C96A3D] hover:underline">
          Admin Panel
        </Link>
      )}
      
      <Link href="/keranjang" className="relative p-2 text-gray-600 hover:text-[#C96A3D] transition-colors" aria-label="Keranjang dan Pesanan">
        <ShoppingCart className="w-5 h-5" />
        {totalCartItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-pulse">
            {totalCartItems}
          </span>
        )}
      </Link>

      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-[#C96A3D] text-white flex items-center justify-center text-xs font-medium">
          {getInitials(profile?.full_name)}
        </div>
      </Link>
      <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-red-600">
        Keluar
      </Button>
    </div>
  );
}
