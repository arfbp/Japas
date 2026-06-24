'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Plus, ShoppingCart, Minus, X } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  status: string;
  featured: boolean;
  is_active: boolean;
}

const EMPTY_ARRAY: any[] = [];

function AddToCartModal({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  product: Product | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (quantity: number) => void;
}) {
  const [quantityStr, setQuantityStr] = useState('30');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantityStr('30');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuantityStr(val);
    
    if (val === '') {
      setError('Minimal pemesanan 30 pcs');
      return;
    }
    
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 30) {
      setError('Minimal pemesanan 30 pcs');
    } else {
      setError('');
    }
  };

  const handleBlur = () => {
    const num = parseInt(quantityStr, 10);
    if (isNaN(num) || num < 30) {
      setQuantityStr('30');
      setError('');
    }
  };

  const handleDecrement = () => {
    const current = parseInt(quantityStr, 10) || 30;
    if (current > 30) {
      const next = current - 1;
      setQuantityStr(next.toString());
      setError('');
    }
  };

  const handleIncrement = () => {
    const current = parseInt(quantityStr, 10) || 30;
    const next = current + 1;
    setQuantityStr(next.toString());
    setError('');
  };

  const currentNum = parseInt(quantityStr, 10) || 0;
  const isInvalid = isNaN(currentNum) || currentNum < 30;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white w-full sm:max-w-sm rounded-t-[20px] sm:rounded-[20px] shadow-xl z-10 p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">Tambah Pesanan</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-[12px] overflow-hidden relative border border-gray-100 flex items-center justify-center text-2xl">
            {product.image_url ? (
               <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
               '🥟'
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h4 className="font-semibold text-gray-900 mb-1 leading-tight">{product.name}</h4>
            <div className="font-bold text-[#C96A3D]">Rp {product.price.toLocaleString('id-ID')} / pcs</div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Minimal 30 pcs)</label>
          <div className="flex items-center justify-center border border-gray-200 rounded-[12px] bg-gray-50 p-1 focus-within:ring-2 focus-within:ring-[#C96A3D] focus-within:border-transparent transition-all overflow-hidden h-14">
            <button 
              onClick={handleDecrement}
              disabled={currentNum <= 30}
              className="w-12 h-full flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 rounded-[8px] transition"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              value={quantityStr}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="flex-1 h-full text-center font-bold text-xl text-gray-900 bg-transparent border-none focus:outline-none appearance-none"
              style={{ WebkitAppearance: 'none', margin: 0 }}
              min="30"
            />
            <button 
              onClick={handleIncrement}
              className="w-12 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-[8px] transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-2 font-medium text-center">{error}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            disabled={isInvalid}
            onClick={() => onConfirm(currentNum)}
            className="w-full h-12 bg-[#C96A3D] hover:bg-[#b05a30] text-white font-semibold rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Tambah ke Keranjang
          </button>
          <button 
            onClick={onClose}
            className="w-full h-12 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 font-semibold rounded-[12px] transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

export function CatalogView({ initialProducts, userId }: { initialProducts: Product[], userId: string | null }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'available'|'sold_out_today'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();
  
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => (userId ? state.itemsByUserId[userId] : undefined) || EMPTY_ARRAY);

  const filteredProducts = initialProducts.filter(product => {
     const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
     const matchesFilter = filter === 'all' || product.status === filter;
     return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (product: Product) => {
    if (!userId) {
       toast.error('Silakan login terlebih dahulu');
       router.push('/login');
       return;
    }
    setSelectedProduct(product);
  };

  const handleConfirmAdd = (quantity: number) => {
    if (!userId || !selectedProduct) return;
    
    addItem(userId, {
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image_url: selectedProduct.image_url,
      quantity: quantity,
    });
    
    toast.success(`${selectedProduct.name} ditambahkan ke keranjang`);
    setSelectedProduct(null);
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col space-y-4 pb-24">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Cari nama kue..." 
          className="pl-9 h-12 bg-white rounded-[12px] shadow-sm border-orange-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button 
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${filter === 'all' ? 'bg-[#C96A3D] text-white border-[#C96A3D]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          Semua
        </button>
        <button 
          onClick={() => setFilter('available')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${filter === 'available' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          Tersedia
        </button>
        <button 
          onClick={() => setFilter('sold_out_today')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${filter === 'sold_out_today' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          Habis Hari Ini
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-16 h-16 bg-gray-50 rounded-[16px] flex items-center justify-center text-3xl border border-gray-100 mb-2">
            {search ? '🔍' : '🍽️'}
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {search ? 'Tidak ditemukan' : 'Katalog Kosong'}
          </h3>
          <p className="text-gray-500 text-sm max-w-[250px]">
            {search ? `Kue dengan pencarian "${search}" tidak ditemukan.` : 'Belum ada kue yang tersedia saat ini. Silakan kembali nanti.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map(product => (
            <div key={product.id} className={`flex items-center gap-3 p-3 bg-white border rounded-[12px] shadow-sm relative overflow-hidden ${product.status === 'sold_out_today' ? 'border-orange-200/60 bg-orange-50/20' : 'border-gray-100'}`}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-100 rounded-[8px] overflow-hidden relative border border-gray-100 flex items-center justify-center text-2xl">
                {product.image_url ? (
                   <Image src={product.image_url} alt={product.name} fill className={`object-cover ${product.status==='sold_out_today' ? 'grayscale opacity-70' : ''}`} unoptimized />
                ) : (
                   '🥟'
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-start justify-between gap-1 mb-1">
                   <h3 className={`font-semibold text-sm truncate ${product.status==='sold_out_today' ? 'text-gray-500' : 'text-gray-900'}`}>
                     {product.name}
                   </h3>
                   <div className="flex gap-1">
                     {product.featured && product.status !== 'sold_out_today' && (
                       <span className="shrink-0 inline-flex px-1.5 py-0.5 bg-[#C96A3D] text-white text-[9px] font-bold uppercase tracking-wider rounded">Unggulan</span>
                     )}
                     {product.status === 'sold_out_today' && (
                       <span className="shrink-0 inline-flex px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wider rounded">Habis</span>
                     )}
                   </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-bold text-[#C96A3D] text-sm">
                    Rp {product.price.toLocaleString('id-ID')}
                  </div>
                  {product.status !== 'sold_out_today' && (
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-1.5 bg-orange-50 text-[#C96A3D] rounded-full hover:bg-orange-100 transition flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalCartItems > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 md:left-64 md:bottom-6 pointer-events-none z-40">
          <div className="max-w-md mx-auto relative">
             <button 
               onClick={() => router.push('/cart')}
               className="pointer-events-auto w-full bg-[#C96A3D] text-white p-4 rounded-[16px] shadow-xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96A3D] transition-transform active:scale-95"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                   <ShoppingCart className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <div className="text-xs font-medium text-white/80">Total Pesanan</div>
                   <div className="font-bold">{cartItems.length} Kue ({totalCartItems} pcs)</div>
                 </div>
               </div>
               <div className="font-semibold">
                 Lihat Keranjang
               </div>
             </button>
          </div>
        </div>
      )}

      <AddToCartModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
}
