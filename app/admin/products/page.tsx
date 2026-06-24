import { AdminLayout } from '@/components/layout/admin-layout';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductsView } from './products-view';
import { redirect } from 'next/navigation';

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/katalog');
  }

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
            <Button className="flex items-center gap-2 bg-[#C96A3D] hover:bg-[#b05a30]">
              <Plus className="w-4 h-4" /> Tambah Kue
            </Button>
          </Link>
        </div>

        <ProductsView initialProducts={products || []} />
      </div>
    </AdminLayout>
  );
}
