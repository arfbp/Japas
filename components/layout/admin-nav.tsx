'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Store } from 'lucide-react';

export function AdminNav() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-800 px-2 py-1.5 -ml-2 rounded-md transition-colors"
      >
        <Store className="w-5 h-5 text-gray-400" />
        <span className="font-bold text-white text-[17px] sm:text-lg">Admin Panel</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-[12px] shadow-lg py-1.5 z-50 border border-gray-100 overflow-hidden">
          <Link
            href="/admin/orders"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Kelola Pesanan
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Kelola Produk
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Pengaturan Toko
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          <Link
            href="/"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Lihat Toko
          </Link>
        </div>
      )}
    </div>
  );
}
