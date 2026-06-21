'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
}

export function CatalogView({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'available'|'sold_out_today'>('all');

  const filteredProducts = initialProducts.filter(product => {
     const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
     const matchesFilter = filter === 'all' || product.status === filter;
     return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col space-y-4">
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
                <div className="flex items-start justify-between gap-1 mb-0.5">
                   <h3 className={`font-semibold text-sm truncate ${product.status==='sold_out_today' ? 'text-gray-500' : 'text-gray-900'}`}>{product.name}</h3>
                   {product.status === 'sold_out_today' && (
                     <span className="shrink-0 inline-flex px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wider rounded">Habis</span>
                   )}
                </div>
                {product.description && (
                  <p className="text-[12px] text-gray-500 line-clamp-1 mb-1.5">{product.description}</p>
                )}
                <div className="font-bold text-[#C96A3D] text-sm">
                  Rp {product.price.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
