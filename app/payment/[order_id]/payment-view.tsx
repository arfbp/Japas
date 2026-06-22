'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle2, MessageCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';

interface PaymentViewProps {
  order: any;
  storeSettings: any;
  user: any;
  existingProof: any;
}

export function PaymentView({ order, storeSettings, user, existingProof }: PaymentViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(!!existingProof);
  const [status, setStatus] = useState(existingProof?.verification_status || 'pending');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      return toast.error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP');
    }

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Ukuran file terlalu besar (Maksimal 10MB)');
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
      const compressedFile = await imageCompression(file, options);
      
      const fileName = `${order.id}.webp`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, compressedFile, {
           contentType: 'image/webp',
           upsert: true 
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Insert record
      const { error: dbError } = await supabase
        .from('payment_proofs')
        .insert({
           order_id: order.id,
           image_url: publicUrlData.publicUrl,
           verification_status: 'pending'
        });

      if (dbError && dbError.code !== '23505') { // Ignore unique violation if already exists
         throw dbError;
      }
      
      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'pending_verification' })
        .eq('id', order.id);

      await supabase
        .from('order_status_history')
        .insert({
           order_id: order.id,
           old_status: 'pending_payment',
           new_status: 'pending_verification',
           note: 'Bukti pembayaran diunggah'
        });

      setProofUploaded(true);
      setStatus('pending');
      toast.success('Bukti pembayaran berhasil diunggah');
      
      router.refresh();

    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunggah bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsApp = (statusStr: string) => {
     if (!storeSettings?.whatsapp_admin) return;
     
     const text = generateWhatsAppMessage(statusStr, order, 'customer_to_admin');
     const url = getWhatsAppURL(storeSettings.whatsapp_admin, text);
     
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
          Rp {order.total_amount.toLocaleString('id-ID')}
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
        <h2 className="font-semibold text-gray-900">Upload Bukti Pembayaran</h2>
        
        {proofUploaded ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8" />
             </div>
             <div className="text-center">
               <div className="font-bold text-gray-900">Bukti Terunggah</div>
               <div className="text-sm text-gray-500 mt-1">Status: {formatStatus(status)}</div>
             </div>
             
             {status === 'rejected' && (
               <div className="text-sm text-red-500 bg-red-50 p-3 rounded-[8px] text-center">
                 Pembayaran ditolak. Silakan upload ulang atau hubungi admin.
                 <div className="mt-4 relative">
                   <input
                     type="file"
                     accept="image/jpeg, image/png, image/webp"
                     onChange={handleFileUpload}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     disabled={uploading}
                   />
                   <div className="px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-gray-700 font-medium">
                     Upload Ulang
                   </div>
                 </div>
               </div>
             )}

             <button 
               onClick={() => handleWhatsApp('pending_verification')}
               className="mt-4 w-full bg-[#25D366] text-white py-3 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2"
             >
               <MessageCircle className="w-5 h-5" />
               Hubungi Admin via WhatsApp
             </button>
             
             <button 
               onClick={() => router.push(`/orders/${order.id}`)}
               className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-[12px] font-bold text-center hover:bg-gray-50 transition"
             >
               Lacak Status Pesanan
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
             <p className="text-sm text-gray-500 text-center">
               Silakan transfer sesuai nominal melalui QRIS di atas, lalu foto/screenshot bukti pembayaran Anda.
             </p>
             
             <button 
               onClick={() => handleWhatsApp('pending_payment')}
               className="w-full bg-[#25D366] text-white py-3 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2 mb-2"
             >
               <MessageCircle className="w-5 h-5" />
               Konfirmasi Order via WhatsApp
             </button>

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
