'use client';

import { useCartStore } from '@/lib/store/cart';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const EMPTY_ARRAY: any[] = [];

export function CartView({ userId }: { userId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const cartItems = useCartStore((state) => (userId ? state.itemsByUserId[userId] : undefined) || EMPTY_ARRAY);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getCartTotal = useCartStore((state) => state.getCartTotal);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Prefetch checkout
    router.prefetch('/checkout');
  }, [router]);

  if (!mounted) return null; // Prevent hydration errors

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-2">
          🛒
        </div>
        <h2 className="text-xl font-bold text-gray-900">Keranjang Kosong</h2>
        <p className="text-gray-500 max-w-xs">
          Belum ada produk di keranjang Anda. Silakan melihat katalog untuk memilih produk.
        </p>
        <Link 
          href="/katalog"
          className="mt-4 px-6 py-3 bg-[#C96A3D] text-white rounded-[12px] font-semibold hover:bg-orange-700 transition"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  const total = getCartTotal(userId);

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Keranjang Anda</h1>
      </div>

      <div className="flex flex-col space-y-4">
        {cartItems.map((item) => (
          <div key={item.product_id} className="flex gap-4 p-4 bg-white rounded-[16px] shadow-sm border border-gray-100">
            <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-[10px] overflow-hidden relative">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🥟</div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                <button 
                  onClick={() => removeItem(userId, item.product_id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[#C96A3D] font-medium text-sm mb-3">
                Rp {item.price.toLocaleString('id-ID')} / pcs
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center border border-gray-200 rounded-[8px] bg-gray-50">
                  <button 
                    onClick={() => updateQuantity(userId, item.product_id, item.quantity - 1)}
                    disabled={item.quantity <= 30}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 rounded-l-[8px] transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-10 text-center font-semibold text-sm text-gray-900">
                    {item.quantity}
                  </div>
                  <button 
                    onClick={() => updateQuantity(userId, item.product_id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-[8px] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:left-64 bg-white border-t border-gray-100 z-40">
        <div className="max-w-7xl mx-auto flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Total Harga</span>
            <span className="font-bold text-[#C96A3D] text-lg">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <button 
            onClick={() => router.push('/checkout')}
            className="w-full bg-[#C96A3D] text-white py-3.5 rounded-[12px] font-bold text-center hover:bg-orange-700 transition flex items-center justify-center gap-2"
          >
            Lanjut Checkout
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
