import { AdminLayout } from '@/components/layout/admin-layout';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Ringkasan aktivitas dan manajemen sistem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[12px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Pesanan</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white rounded-[12px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pelanggan Aktif</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white rounded-[12px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pendapatan</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-gray-400">Modul pesanan dan katalog akan segera hadir di bagian ini.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
