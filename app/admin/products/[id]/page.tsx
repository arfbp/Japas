import { AdminLayout } from '@/components/layout/admin-layout';
import ProductForm from '../product-form';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();

  if (!product) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubah Produk</h1>
          <p className="text-gray-500 mt-1 text-sm">Perbarui informasi, harga, dan ketersediaan kue.</p>
        </div>
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
          <ProductForm product={product} />
        </div>
      </div>
    </AdminLayout>
  );
}
