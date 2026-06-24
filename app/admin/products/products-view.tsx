'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ProductsViewProps {
  initialProducts: any[];
}

export function ProductsView({ initialProducts }: ProductsViewProps) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const supabase = createClient();

  const handleStatusChange = async (productId: string, currentStatus: string) => {
    // Cycle through statuses: available -> sold_out_today -> inactive -> available
    const nextStatus = 
      currentStatus === 'available' ? 'sold_out_today' : 
      currentStatus === 'sold_out_today' ? 'inactive' : 'available';

    setLoadingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: nextStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, status: nextStatus } : p
      ));
      toast.success('Status berhasil diubah');
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredProducts = products.filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'available', label: 'Tersedia' },
          { id: 'sold_out_today', label: 'Habis Hari Ini' },
          { id: 'inactive', label: 'Tidak Aktif' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === tab.id 
                ? 'bg-[#C96A3D] text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada produk untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Produk</th>
                  <th className="px-6 py-4 font-medium">Harga</th>
                  <th className="px-6 py-4 font-medium">Sort Order</th>
                  <th className="px-6 py-4 font-medium">Status (Klik untuk ubah)</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden relative shrink-0 border border-gray-200">
                          {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🥟</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {product.name}
                            {product.featured && (
                              <span className="bg-[#C96A3D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase">Pilihan</span>
                            )}
                          </div>
                          {!product.is_active && <div className="text-xs text-red-500 font-medium">Nonaktif</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {product.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusChange(product.id, product.status)}
                        disabled={loadingId === product.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition hover:opacity-80 disabled:opacity-50 ${
                          product.status === 'available' ? 'bg-green-100 text-green-700' :
                          product.status === 'sold_out_today' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {loadingId === product.id ? 'Memuat...' : (
                          product.status === 'available' ? 'Tersedia' :
                          product.status === 'sold_out_today' ? 'Habis Hari Ini' : 'Tidak Aktif'
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
