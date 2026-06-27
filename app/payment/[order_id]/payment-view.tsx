'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle2, MessageCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';
import { normalizePhone } from '@/lib/phone';

interface PaymentViewProps {
  order: any;
  storeSettings: any;
  user: any;
  existingProof: any;
}

export function PaymentView({ order, storeSettings, user, existingProof }: PaymentViewProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(!!existingProof);
  const [status, setStatus] = useState(existingProof?.verification_status || 'pending');
  const [orderStatus, setOrderStatus] = useState(order.status);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      return toast.error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Ukuran file terlalu besar (Maksimal 5MB)');
    }

    try {
      setUploading(true);
      
      // Compress
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      
      let compressedFile;
      try {
        compressedFile = await imageCompression(file, options);
      } catch (err) {
        console.error('Error compressing image:', err);
        throw new Error('Gagal mengompresi gambar');
      }
      
      const fileName = `${order.id}.webp`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, compressedFile, {
           contentType: 'image/webp',
           upsert: true 
         });

      if (storageError) {
        throw new Error(`Gagal mengunggah file ke penyimpanan: ${storageError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik dari file bukti pembayaran');
      }

      // Step 1: Insert to payment_proofs table (using upsert in case of resubmission)
      const { error: dbError } = await supabase
        .from('payment_proofs')
        .upsert({
           order_id: order.id,
           image_url: publicUrlData.publicUrl,
           verification_status: 'pending'
        }, {
           onConflict: 'order_id'
        });

      if (dbError) {
         throw new Error(`Gagal menyimpan bukti pembayaran ke database: ${dbError.message}`);
      }
      
      // Step 2: Update orders table
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'pending_verification' })
        .eq('id', order.id);

      if (orderUpdateError) {
        throw new Error(`Gagal memperbarui status pesanan: ${orderUpdateError.message}`);
      }

      // Step 3: Insert to order_status_history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
           order_id: order.id,
           old_status: 'pending_payment',
           new_status: 'pending_verification',
           changed_by: user.id
        });

      if (historyError) {
        throw new Error(`Gagal mencatat riwayat status pesanan: ${historyError.message}`);
      }

      // Step 4: Show WhatsApp button after all steps succeed (by updating states)
      setProofUploaded(true);
      setStatus('pending');
      setOrderStatus('pending_verification');
      
      toast.success('Bukti pembayaran berhasil diunggah');
      
      router.refresh();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal mengunggah bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsApp = (statusStr: string) => {
     if (!storeSettings?.whatsapp_admin) return;
     
     const text = generateWhatsAppMessage(statusStr, order, 'customer_to_admin');
     const normalizedAdminPhone = normalizePhone(storeSettings.whatsapp_admin);
     const url = getWhatsAppURL(normalizedAdminPhone, text);
     
     window.open(url, '_blank');
  };

  const formatStatus = (s: string) => {
     switch (s) {
       case 'pending': return 'Menunggu Verifikasi';
       case 'accepted': return 'Pembayaran Diterima';
       case 'rejected': return 'Pembayaran Ditolak';
       default: return 'Pending';
     }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-bold text-gray-900">Pembayaran</h1>
        <p className="text-sm text-gray-500">Order #{order.order_number}</p>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4">
        <h2 className="font-semibold text-gray-900">Total Tagihan</h2>
        <div className="text-3xl font-bold text-[#C96A3D]">
          Rp {(order?.total_amount ?? 0).toLocaleString('id-ID')}
        </div>
        
        {storeSettings?.qris_image_url ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-[12px] border border-gray-200">
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image 
                src={storeSettings.qris_image_url} 
                alt="QRIS" 
                fill 
                className="object-contain" 
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-[12px] w-full text-center text-gray-500">
            QRIS tidak tersedia. Hubungi admin.
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <h2 className="font-semibold text-gray-900">Ringkasan Pesanan</h2>
        <div className="space-y-3">
          {order.order_items?.map((item: any) => {
            const itemPrice = item.product_price ?? item.price_at_time ?? 0;
            return (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  <span className="text-gray-500">{item.quantity} x Rp {(itemPrice).toLocaleString('id-ID')}</span>
                </div>
                <span className="font-semibold text-gray-900">Rp {(item.quantity * itemPrice).toLocaleString('id-ID')}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <h2 className="font-semibold text-gray-900">Upload Bukti Pembayaran</h2>
        
        {orderStatus !== 'pending_payment' ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8" />
             </div>
             <div className="text-center px-4">
               <div className="font-bold text-gray-900 text-base">Bukti pembayaran sudah diunggah, menunggu verifikasi admin</div>
               <div className="text-sm text-gray-500 mt-1">Status Pesanan: {orderStatus === 'pending_verification' ? 'Menunggu Verifikasi' : 'Diproses / Selesai'}</div>
             </div>
             
             <button 
               onClick={() => handleWhatsApp('pending_verification')}
               className="mt-4 w-full bg-[#25D366] text-white py-3 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2 cursor-pointer"
             >
               <MessageCircle className="w-5 h-5" />
               Hubungi Admin via WhatsApp
             </button>
             
             <button 
               onClick={() => router.push(`/orders/${order.id}`)}
               className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-[12px] font-bold text-center hover:bg-gray-50 transition cursor-pointer"
             >
               Lacak Status Pesanan
             </button>
          </div>
        ) : proofUploaded ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8" />
             </div>
             <div className="text-center">
               <div className="font-bold text-gray-900">Bukti Terunggah</div>
               <div className="text-sm text-gray-500 mt-1">Status: {formatStatus(status)}</div>
             </div>
             
             {status === 'rejected' && (
               <div className="text-sm text-red-500 bg-red-50 p-3 rounded-[8px] text-center w-full">
                 Pembayaran ditolak. Silakan upload ulang atau hubungi admin.
                 <div className="mt-4 relative">
                   <input
                     type="file"
                     accept="image/jpeg, image/png, image/webp"
                     onChange={handleFileUpload}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     disabled={uploading}
                   />
                   <div className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer">
                     Upload Ulang
                   </div>
                 </div>
               </div>
             )}

             <button 
               onClick={() => handleWhatsApp('pending_verification')}
               className="mt-4 w-full bg-[#25D366] text-white py-3 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2 cursor-pointer"
             >
               <MessageCircle className="w-5 h-5" />
               Hubungi Admin via WhatsApp
             </button>
             
             <button 
               onClick={() => router.push(`/orders/${order.id}`)}
               className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-[12px] font-bold text-center hover:bg-gray-50 transition cursor-pointer"
             >
               Lacak Status Pesanan
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
             <p className="text-sm text-gray-500 text-center">
               Transfer sesuai nominal, lalu upload bukti pembayaran
             </p>

             <div className="relative w-full">
               <input 
                 type="file" 
                 accept="image/jpeg, image/png, image/webp"
                 onChange={handleFileUpload}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 disabled={uploading}
               />
               <button 
                 type="button"
                 disabled={uploading}
                 className="w-full bg-orange-50 border-2 border-dashed border-[#C96A3D] text-[#C96A3D] py-8 rounded-[12px] font-medium text-center flex flex-col items-center justify-center gap-2"
               >
                 {uploading ? (
                   <>
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span className="text-sm">Mengunggah...</span>
                   </>
                 ) : (
                   <>
                     <UploadCloud className="w-8 h-8" />
                     <span className="text-sm">Pilih File Bukti Pembayaran</span>
                     <span className="text-xs text-gray-500">Maksimal 10MB (JPG/PNG/WEBP)</span>
                   </>
                 )}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
