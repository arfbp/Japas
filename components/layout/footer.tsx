export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-orange-100 py-8 px-4 md:px-8 mt-auto pb-12 sm:pb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-600">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-2">Jajanan Pasar</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Pesan berbagai sajian kue tradisional untuk kebutuhan Anda. Mudah, cepat, dan terpercaya.</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 pb-1">Menu</h3>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-[#C96A3D] transition-colors">Tentang Kami</a></li>
            <li><a href="#" className="hover:text-[#C96A3D] transition-colors">Cara Pemesanan</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 pb-1">Kontak</h3>
          <ul className="space-y-2 text-xs">
            <li>WhatsApp:<br/>+62 812 3456 7890</li>
            <li>Jam Operasional:<br/>Senin - Minggu, 06:00 - 15:00</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 pb-1">Alamat</h3>
          <p className="text-xs">Jl. Jajanan Pasar No. 123<br/>Jakarta Selatan, 12345</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Jajanan Pasar. All rights reserved.
      </div>
    </footer>
  );
}
