import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default async function HomePage() {
  let role = 'guest';
  let featuredProducts: any[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      role = data?.role || 'customer';
    }

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'available')
      .order('sort_order', { ascending: true })
      .limit(6);
      
    if (prods) {
      featuredProducts = prods;
    }
  }

  const isLoggedIn = role !== 'guest';

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col text-center py-6 sm:py-10 px-0 space-y-12">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center space-y-5 pt-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 rounded-[16px] flex items-center justify-center mb-1 shadow-sm border border-orange-100/80 rotate-2">
            <span className="text-3xl sm:text-4xl translate-y-px">🥟</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.2] max-w-2xl mx-auto px-4">
            Pesan Kue Jajanan Pasar<br className="hidden sm:block" /> untuk Acara dan Kebutuhan Anda
          </h1>
          <p className="text-[15px] sm:text-lg text-gray-600 max-w-lg mx-auto leading-relaxed px-4">
            Minimal 30 pcs per jenis kue. Mudah dipesan, bayar via QRIS, dan ambil sesuai jadwal.
          </p>
          <div className="pt-3 px-4 w-full sm:w-auto">
            <Link href={isLoggedIn ? "/katalog" : "/login"} className="w-full block sm:inline-block">
              <Button size="lg" className="w-full sm:w-auto text-[15px] h-12 px-8 rounded-full shadow-md font-semibold active:scale-[0.98] transition-transform">
                Masuk untuk Mulai Pesan
              </Button>
            </Link>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">Cara Pemesanan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: '1', title: 'Pilih Kue', icon: '🧁' },
              { step: '2', title: 'Tentukan Jumlah', icon: '📦' },
              { step: '3', title: 'Bayar via QRIS', icon: '📱' },
              { step: '4', title: 'Ambil Pesanan', icon: '🛍️' },
            ].map((item) => (
              <div key={item.step} className="bg-white p-4 rounded-[16px] shadow-sm border border-orange-50 flex flex-col items-center text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-[11px] font-bold text-[#C96A3D] mb-1 uppercase tracking-wider">Step {item.step}</div>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section className="px-4 mx-4 bg-orange-50/50 py-6 sm:py-8 rounded-[16px] text-left border border-orange-100/50">
          <div className="max-w-2xl mx-auto">
             <h2 className="text-lg font-bold text-gray-900 mb-5 px-2">Kenapa Pesan di Sini?</h2>
             <ul className="space-y-3.5 px-2">
               {[
                 "Minimal pemesanan 30 pcs per jenis kue",
                 "Pembayaran mudah dan cepat dengan QRIS",
                 "Sangat cocok untuk acara kantor, rapat, dan keluarga",
                 "Dapatkan konfirmasi pesanan instan via WhatsApp"
               ].map((benefit, i) => (
                 <li key={i} className="flex items-start gap-3">
                   <div className="mt-0.5 rounded-full bg-green-100 p-0.5 outline outline-1 outline-green-200 shrink-0">
                     <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <span className="text-[14px] text-gray-700 leading-snug">{benefit}</span>
                 </li>
               ))}
             </ul>
          </div>
        </section>

        {/* FAVORITES PREVIEW */}
        {featuredProducts.length > 0 && (
          <section className="px-4 text-left pb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Kue Favorit</h2>
              <Link href="/katalog" className="text-sm font-semibold text-[#C96A3D] hover:underline">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-[12px] shadow-sm">
                  <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-[8px] overflow-hidden relative border border-gray-100">
                    {product.image_url ? (
                       <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-2xl">🥟</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-sm truncate text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-[12px] text-gray-500 line-clamp-1 mb-1">{product.description}</p>
                    )}
                    <div className="font-bold text-[#C96A3D] text-sm mt-0.5">
                      Rp {product.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/katalog">
                <Button variant="outline" className="w-full sm:w-auto rounded-full font-semibold px-8 h-10 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
                  Lihat Semua Kue
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
