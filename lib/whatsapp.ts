export const formatWA = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const generateWhatsAppMessage = (status: string, order: any, actionType: 'customer_to_admin' | 'admin_to_customer' = 'admin_to_customer') => {
  if (actionType === 'customer_to_admin') {
    if (status === 'pending_payment') {
      return `Halo Admin, saya ingin melakukan konfirmasi.

Order: ${order.order_number}
Nama: ${order.customer_name}
Total: Rp ${order.total_amount?.toLocaleString('id-ID')}
Status: Menunggu Pembayaran`;
    }
    if (status === 'pending_verification') {
      return `Halo Admin, saya telah melakukan pembayaran.
Order: ${order.order_number}
Nama: ${order.customer_name}
No HP: ${order.customer_phone}
Tanggal Pickup: ${new Date(order.pickup_date).toLocaleDateString('id-ID')}
Total: Rp ${order.total_amount?.toLocaleString('id-ID')}
Status: Menunggu verifikasi pembayaran`;
    }
    if (status === 'ready_for_pickup') {
      return `Halo Admin, pesanan saya sudah siap diambil.
Order: ${order.order_number}
Nama: ${order.customer_name}`;
    }
    return `Halo Admin, saya ingin menanyakan pesanan saya:\n\nOrder Number: ${order.order_number}\nNama: ${order.customer_name}\nStatus: ${status}`;
  }

  // Admin to Customer
  switch (status) {
    case 'pending_payment':
      return `Pesanan Anda telah dibuat.

Order: ${order.order_number}
Nama: ${order.customer_name}
Total: Rp ${order.total_amount?.toLocaleString('id-ID')}

Silakan lakukan pembayaran via QRIS dan upload bukti pembayaran melalui link berikut.`;

    case 'pending_verification':
      return `Terima kasih, bukti pembayaran Anda telah diterima.

Order: ${order.order_number}
Status: Menunggu verifikasi admin

Kami akan segera memproses pesanan Anda.`;

    case 'payment_accepted':
      return `Pembayaran Anda telah diverifikasi.

Order: ${order.order_number}
Status: Pembayaran diterima

Pesanan Anda sedang diproses.`;

    case 'processing':
      return `Pesanan Anda sedang disiapkan.

Order: ${order.order_number}
Mohon tunggu hingga status siap diambil.`;

    case 'ready_for_pickup':
      return `Pesanan Anda sudah siap diambil.

Order: ${order.order_number}
Silakan datang ke lokasi pengambilan.`;

    case 'completed':
      return `Pesanan Anda telah selesai.

Terima kasih telah memesan di Jajanan Pasar.`;

    case 'cancelled':
      return `Pesanan Anda telah dibatalkan.

Order: ${order.order_number}
Silakan hubungi admin jika ada pertanyaan.`;

    default:
      return '';
  }
};

export const getWhatsAppURL = (phone: string, text: string) => {
  return `https://wa.me/${formatWA(phone)}?text=${encodeURIComponent(text)}`;
};
