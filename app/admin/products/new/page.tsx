import { AdminLayout } from '@/components/layout/admin-layout';
import ProductForm from '../product-form';

export default function NewProductPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Kue Baru</h1>
          <p className="text-gray-500 mt-1 text-sm">Masukkan informasi detail untuk kue baru.</p>
        </div>
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
          <ProductForm />
        </div>
      </div>
    </AdminLayout>
  );
}
