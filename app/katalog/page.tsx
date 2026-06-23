import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { CatalogView } from './catalog-view';
import { Suspense } from 'react';
import CatalogLoading from './loading';

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('status', ['available', 'sold_out_today'])
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return (
    <AuthenticatedLayout>
      <Suspense fallback={<CatalogLoading />}>
        <CatalogView initialProducts={products || []} userId={user?.id || null} />
      </Suspense>
    </AuthenticatedLayout>
  );
}
