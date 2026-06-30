'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2, X, Store, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { validateImageFile } from '@/lib/validate-file';
import { sanitizeText } from '@/lib/sanitize';

export function SettingsView({ initialSettings, initialAnnouncements }: { initialSettings: any, initialAnnouncements: any[] }) {
  const router = useRouter();
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Store Settings State
  const [storeName, setStoreName] = useState(initialSettings?.store_name || '');
  const [pickupAddress, setPickupAddress] = useState(initialSettings?.pickup_address || '');
  const [whatsappAdmin, setWhatsappAdmin] = useState(initialSettings?.whatsapp_admin || '');
  const [qrisUrl, setQrisUrl] = useState(initialSettings?.qris_image_url || '');
  const [isStoreOpen, setIsStoreOpen] = useState(initialSettings?.is_store_open ?? true);
  const [cutoffTime, setCutoffTime] = useState(initialSettings?.cutoff_time || '18:00:00');
  const [leadDays, setLeadDays] = useState(initialSettings?.minimum_lead_days || 3);

  // Announcements State
  const [announcements, setAnnouncements] = useState(initialAnnouncements || []);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  
  const [aTitle, setATitle] = useState('');
  const [aContent, setAContent] = useState('');
  const [aActive, setAActive] = useState(true);
  const [aStart, setAStart] = useState('');
  const [aEnd, setAEnd] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const supabase = createClientComponentClient();

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qris-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      setQrisUrl(publicUrl);
      toast.success('Gambar QRIS berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah QRIS: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveStore = async () => {
    if (!storeName || !pickupAddress || !whatsappAdmin) {
      return toast.error('Lengkapi form pengaturan toko terlebih dahulu');
    }

    setIsSavingStore(true);
    try {
      const settingsData = {
        store_name: sanitizeText(storeName),
        pickup_address: sanitizeText(pickupAddress),
        whatsapp_admin: sanitizeText(whatsappAdmin),
        qris_image_url: qrisUrl,
        is_store_open: isStoreOpen,
        cutoff_time: cutoffTime.length === 5 ? `${cutoffTime}:00` : cutoffTime, // ensure HH:mm:ss format
        minimum_lead_days: parseInt(leadDays.toString(), 10),
        singleton_key: true
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert(settingsData, { onConflict: 'singleton_key' });

      if (error) throw error;

      toast.success('Pengaturan toko berhasil disimpan');
      setIsEditMode(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Gagal menyimpan pengaturan: ' + error.message);
    } finally {
      setIsSavingStore(false);
    }
  };

  const openNewAnnouncementModal = () => {
    setEditingAnnouncement(null);
    setATitle('');
    setAContent('');
    setAActive(true);
    setAStart('');
    setAEnd('');
    setIsAnnouncementModalOpen(true);
  };

  const openEditAnnouncementModal = (a: any) => {
    setEditingAnnouncement(a);
    setATitle(a.title || '');
    setAContent(a.content || '');
    setAActive(a.is_active ?? true);
    setAStart(a.start_date ? a.start_date.split('T')[0] : '');
    setAEnd(a.end_date ? a.end_date.split('T')[0] : '');
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!aTitle || !aContent) {
      return toast.error('Judul dan isi pengumuman wajib diisi');
    }

    setIsSavingAnnouncement(true);
    try {
      const payload: any = {
        title: sanitizeText(aTitle),
        content: sanitizeText(aContent),
        is_active: aActive,
        start_date: aStart || null,
        end_date: aEnd || null,
      };

      if (editingAnnouncement?.id) {
        payload.id = editingAnnouncement.id;
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([payload]);
        if (error) throw error;
      }

      toast.success('Pengumuman berhasil disimpan');
      setIsAnnouncementModalOpen(false);
      router.refresh();
      
      // Update local state temporarily for snappy UI
      if (editingAnnouncement?.id) {
        setAnnouncements(announcements.map((a: any) => a.id === editingAnnouncement.id ? { ...a, ...payload } : a));
      } else {
        // Will be replaced by router.refresh() anyway
      }
    } catch (error: any) {
      console.error('Full announcement save error:', error);
      toast.error(error.message || 'Terjadi kesalahan tidak dikenal saat menyimpan');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Pengumuman berhasil dihapus');
      setAnnouncements(announcements.filter((a: any) => a.id !== id));
      router.refresh();
    } catch (error: any) {
      console.error('Full announcement delete error:', error);
      toast.error(error.message || 'Terjadi kesalahan tidak dikenal saat menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1>
        <p className="text-gray-500 mt-1 text-sm">Kelola informasi toko, jadwal operasional, dan pengumuman.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings Form */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-gray-100 flex flex-col gap-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Informasi Umum</h2>
            </div>
            {!isEditMode && (
              <button 
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-200 transition flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
            <input 
              type="text" 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)}
              disabled={!isEditMode}
              className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Contoh: Toko Kue ABC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengambilan</label>
            <textarea 
              value={pickupAddress} 
              onChange={e => setPickupAddress(e.target.value)}
              rows={3}
              disabled={!isEditMode}
              className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Alamat lengkap toko untuk customer mengambil pesanan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Admin</label>
            <input 
              type="text" 
              value={whatsappAdmin} 
              onChange={e => setWhatsappAdmin(e.target.value)}
              disabled={!isEditMode}
              className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Contoh: +628123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload QRIS Pembayaran</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0 bg-gray-50 border border-gray-200 rounded-[8px] flex items-center justify-center overflow-hidden relative">
                {qrisUrl ? (
                  <Image src={qrisUrl} alt="QRIS" fill className="object-contain p-1" unoptimized />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              {isEditMode && (
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] transition text-center inline-block">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Pilih Gambar'}
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleQrisUpload} disabled={isUploading} />
                  </label>
                  <p className="text-xs text-gray-500">Format: JPG, PNG, WebP.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-900">Operasional Pemesanan</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">Status Toko</label>
                <p className="text-xs text-gray-500">Buka atau tutup sementara</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isStoreOpen} onChange={e => setIsStoreOpen(e.target.checked)} disabled={!isEditMode} />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C96A3D] ${!isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Cutoff (Batas)</label>
                <input 
                  type="time" 
                  value={cutoffTime.substring(0,5)} 
                  onChange={e => setCutoffTime(e.target.value)}
                  disabled={!isEditMode}
                  className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Hari Pickup</label>
                <input 
                  type="number" 
                  value={leadDays} 
                  onChange={e => setLeadDays(parseInt(e.target.value))}
                  min="0"
                  disabled={!isEditMode}
                  className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {isEditMode && (
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => {
                  setStoreName(initialSettings?.store_name || '');
                  setPickupAddress(initialSettings?.pickup_address || '');
                  setWhatsappAdmin(initialSettings?.whatsapp_admin || '');
                  setQrisUrl(initialSettings?.qris_image_url || '');
                  setIsStoreOpen(initialSettings?.is_store_open ?? true);
                  setCutoffTime(initialSettings?.cutoff_time || '18:00:00');
                  setLeadDays(initialSettings?.minimum_lead_days || 3);
                  setIsEditMode(false);
                }}
                disabled={isSavingStore}
                className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-[8px] font-semibold flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-70"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveStore}
                disabled={isSavingStore}
                className="flex-1 h-11 bg-[#C96A3D] text-white rounded-[8px] font-semibold flex items-center justify-center hover:bg-[#b05a30] transition disabled:opacity-70"
              >
                {isSavingStore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
              </button>
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Pengumuman Toko</h2>
            <button 
              onClick={openNewAnnouncementModal}
              className="px-3 py-1.5 bg-[#C96A3D] text-white text-sm font-medium rounded-[6px] hover:bg-[#b05a30] transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {announcements.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-10">
                Belum ada pengumuman
              </div>
            ) : (
              announcements.map((a: any) => (
                <div key={a.id} className="p-4 border border-gray-100 rounded-[12px] hover:border-[#C96A3D]/30 transition group">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEditAnnouncementModal(a)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                  
                  {(a.start_date || a.end_date) && (
                    <div className="text-xs text-gray-400 mt-2 font-mono">
                      {a.start_date ? a.start_date.split('T')[0] : '...'} s/d {a.end_date ? a.end_date.split('T')[0] : '...'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAnnouncementModalOpen(false)} />
          <div className="bg-white rounded-[20px] shadow-xl z-10 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-gray-900">{editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input 
                  type="text" 
                  value={aTitle} 
                  onChange={e => setATitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none"
                  placeholder="Contoh: Info Libur Lebaran"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                <textarea 
                  value={aContent} 
                  onChange={e => setAContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none"
                  placeholder="Tulis detail pengumuman di sini..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai <span className="font-normal text-gray-400">(Opsional)</span></label>
                  <input 
                    type="date" 
                    value={aStart} 
                    onChange={e => setAStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai <span className="font-normal text-gray-400">(Opsional)</span></label>
                  <input 
                    type="date" 
                    value={aEnd} 
                    onChange={e => setAEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-[#C96A3D] focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-700">Tampilkan ke Customer?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={aActive} onChange={e => setAActive(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C96A3D]"></div>
                </label>
              </div>

              <button 
                onClick={handleSaveAnnouncement}
                disabled={isSavingAnnouncement}
                className="w-full h-11 mt-4 bg-[#C96A3D] text-white rounded-[8px] font-semibold flex items-center justify-center hover:bg-[#b05a30] transition disabled:opacity-70"
              >
                {isSavingAnnouncement ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Pengumuman'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
