'use client';

import { useCartStore, CartItem } from '@/lib/store/cart';
import { Minus, Plus, Trash2, ArrowRight, ChevronRight, ShoppingCart, Calendar, Tag, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  pickup_date: string;
  created_at: string;
}

const EMPTY_ARRAY: any[] = [];

function CartItemCard({ item, userId, updateQuantity, removeItem }: any) {
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(item.quantity.toString());
    if (item.quantity >= 30) {
      setError('');
    }
  }, [item.quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (val === '') {
      setError('Minimal pemesanan 30 pcs');
      return;
    }
    
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 30) {
      setError('Minimal pemesanan 30 pcs');
    } else {
      setError('');
      updateQuantity(userId, item.product_id, num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 30) {
      setInputValue('30');
      setError('');
      updateQuantity(userId, item.product_id, 30);
    }
  };

  const handleDecrement = () => {
    const current = parseInt(inputValue, 10) || item.quantity;
    if (current > 30) {
      const next = current - 1;
      setInputValue(next.toString());
      setError('');
      updateQuantity(userId, item.product_id, next);
    }
  };

  const handleIncrement = () => {
    const current = parseInt(inputValue, 10) || item.quantity;
    const next = current + 1;
    setInputValue(next.toString());
    setError('');
    updateQuantity(userId, item.product_id, next);
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-[16px] shadow-sm border border-gray-100">
      <div className="flex gap-4">
        <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-[10px] overflow-hidden relative">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
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
            <div className="flex items-center border border-gray-200 rounded-[8px] bg-gray-50 focus-within:ring-1 focus-within:ring-[#C96A3D] focus-within:border-[#C96A3D] overflow-hidden">
              <button 
                onClick={handleDecrement}
                disabled={item.quantity <= 30 || parseInt(inputValue, 10) <= 30}
                className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-12 h-8 text-center font-semibold text-sm text-gray-900 bg-transparent border-none focus:outline-none appearance-none"
                style={{ WebkitAppearance: 'none', margin: 0 }}
                min="30"
              />
              <button 
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
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
      {error && (
        <div className="text-xs text-red-500 font-medium text-right mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

export function KeranjangView({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const cartItems = useCartStore((state) => (userId ? state.itemsByUserId[userId] : undefined) || EMPTY_ARRAY);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getCartTotal = useCartStore((state) => state.getCartTotal);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const supabase = createClientComponentClient();

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, pickup_date, created_at')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [userId, supabase]);

  // If URL has tab=orders, open that tab automatically
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('orders');
    }
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (userId) {
      fetchCart(userId);
      fetchOrders();
    }
  }, [userId, fetchCart, fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'pending_verification': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'payment_accepted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'ready_for_pickup': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Menunggu Pembayaran';
      case 'pending_verification': return 'Verifikasi Pembayaran';
      case 'payment_accepted': return 'Pembayaran Diterima';
      case 'processing': return 'Diproses';
      case 'ready_for_pickup': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (!mounted) return null;

  const total = getCartTotal(userId);

  return (
    <div className="flex flex-col space-y-6 pb-28 px-4 sm:px-0">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors border-b-2 relative ${
            activeTab === 'cart'
              ? 'border-[#C96A3D] text-[#C96A3D]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Keranjang</span>
            {cartItems.length > 0 && (
              <span className="bg-[#C96A3D] text-white text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                {cartItems.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors border-b-2 relative ${
            activeTab === 'orders'
              ? 'border-[#C96A3D] text-[#C96A3D]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Tag className="w-4 h-4" />
            <span>Pesanan Saya</span>
            {orders.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                {orders.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'cart' ? (
        <div className="space-y-6">
          {cartItems.length === 0 ? (
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
          ) : (
            <>
              <div className="flex flex-col space-y-4">
                {cartItems.map((item) => (
                  <CartItemCard 
                    key={item.product_id}
                    item={item} 
                    userId={userId} 
                    updateQuantity={updateQuantity} 
                    removeItem={removeItem} 
                  />
                ))}
              </div>

              {/* Bottom Sticky Total and CTA */}
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
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-[#C96A3D] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-2">
                📦
              </div>
              <h2 className="text-xl font-bold text-gray-900">Belum Ada Pesanan</h2>
              <p className="text-gray-500 max-w-xs">
                Anda belum pernah memesan kue di toko kami. Silakan buat pesanan pertama Anda!
              </p>
              <Link 
                href="/katalog"
                className="mt-4 px-6 py-3 bg-[#C96A3D] text-white rounded-[12px] font-semibold hover:bg-orange-700 transition"
              >
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => {
                const isPendingPayment = order.status === 'pending_payment';
                const formattedDate = format(new Date(order.pickup_date), 'dd MMMM yyyy', { locale: localeID });
                
                return (
                  <div 
                    key={order.id} 
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="group bg-white rounded-[16px] p-5 shadow-sm border border-gray-100 hover:border-orange-200 transition cursor-pointer flex flex-col space-y-4"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-gray-900 group-hover:text-[#C96A3D] transition-colors text-sm sm:text-base">
                          #{order.order_number}
                        </span>
                        <span className="text-xs text-gray-400">
                          Dibuat pada {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: localeID })}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-50 gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center text-xs text-gray-500 gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Ambil: {formattedDate}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          <span>Total Tagihan: <strong className="text-gray-900 text-sm font-bold">Rp {order.total_amount.toLocaleString('id-ID')}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isPendingPayment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/payment/${order.id}`);
                            }}
                            className="px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded-[10px] text-xs font-bold transition flex items-center gap-1"
                          >
                            Bayar Sekarang
                          </button>
                        )}
                        <span className="p-1.5 bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-[#C96A3D] rounded-full transition">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
