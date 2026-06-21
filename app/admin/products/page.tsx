import { AdminLayout } from '@/components/layout/admin-layout';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import Image from 'next/image';

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Kue</h1>
            <p className="text-gray-500 mt-1 text-sm">Kelola katalog produk, harga, dan ketersediaan.</p>
          </div>
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Kue
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
          {products?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Belum ada produk. Silakan tambah kue pertama.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Produk</th>
                    <th className="px-6 py-4 font-medium">Harga</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products?.map((product) => (
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
                            <div className="font-medium text-gray-900">{product.name}</div>
                            {product.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        Rp {product.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${
                          product.status === 'available' ? 'bg-green-100 text-green-700' :
                          product.status === 'sold_out_today' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status === 'available' ? 'Tersedia' :
                           product.status === 'sold_out_today' ? 'Habis Hari Ini' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
