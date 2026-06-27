'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Package, CheckSquare, ShoppingBag, XCircle, MessageCircle, Edit2, Trash2, Plus, Minus, X, Loader2, Calendar } from 'lucide-react';
import { format, addDays, isAfter, setHours, setMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';
import { normalizePhone } from '@/lib/phone';
import { cancelOrder, editOrder } from './actions';

interface OrderTrackingViewProps {
  order: any;
  items: any[];
  history: any[];
  storeSettings: any;
}

const STATUS_STEPS = [
  { id: 'pending_payment', label: 'Menunggu Pembayaran', icon: Clock },
  { id: 'pending_verification', label: 'Verifikasi Pembayaran', icon: CheckSquare },
  { id: 'payment_accepted', label: 'Pembayaran Diterima', icon: CheckSquare },
  { id: 'processing', label: 'Diproses', icon: Package },
  { id: 'ready_for_pickup', label: 'Siap Diambil', icon: ShoppingBag },
  { id: 'completed', label: 'Selesai', icon: CheckCircle2 },
];

export function OrderTrackingView({ order: initialOrder, items, history: initialHistory, storeSettings }: OrderTrackingViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [history, setHistory] = useState(initialHistory);
  const [orderItems, setOrderItems] = useState(items);
  const [cancelling, setCancelling] = useState(false);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState('');
  const [editPickupTime, setEditPickupTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${order.id}` }, (payload) => {
        setHistory((prev: any) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('status', ['available', 'sold_out_today'])
        .order('name');
      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      return;
    }

    try {
      setCancelling(true);
      const res = await cancelOrder(order.id);
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success('Pesanan berhasil dibatalkan');
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
      router.refresh();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast.error(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditPickupDate(order.pickup_date);
    setEditPickupTime(order.pickup_time || '');
    setEditNotes(order.notes || '');
    setEditItems(orderItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity
    })));
    setIsEditModalOpen(true);
    fetchAvailableProducts();
  };

  const handleEditItemQtyChange = (productId: string, val: string) => {
    setEditItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: val === '' ? 0 : parseInt(val, 10) };
      }
      return item;
    }));
  };

  const handleEditItemQtyBlur = (productId: string, currentVal: number) => {
    if (isNaN(currentVal) || currentVal < 30) {
      setEditItems(prev => prev.map(item => {
        if (item.product_id === productId) {
          return { ...item, quantity: 30 };
        }
        return item;
      }));
      toast.error('Minimal pemesanan adalah 30 pcs');
    }
  };

  const handleEditItemDecrement = (productId: string) => {
    setEditItems(prev => prev.map(item => {
      if (item.product_id === productId && item.quantity > 30) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const handleEditItemIncrement = (productId: string) => {
    setEditItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const handleRemoveEditItem = (productId: string) => {
    if (editItems.length <= 1) {
      toast.error('Pesanan harus memiliki minimal 1 produk');
      return;
    }
    setEditItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleAddProductToEdit = () => {
    if (!selectedProductIdToAdd) return;
    const prod = availableProducts.find(p => p.id === selectedProductIdToAdd);
    if (!prod) return;

    if (editItems.some(i => i.product_id === prod.id)) {
      toast.error('Produk sudah ada di dalam pesanan');
      return;
    }

    setEditItems(prev => [...prev, {
      product_id: prod.id,
      product_name: prod.name,
      product_price: prod.price,
      quantity: 30
    }]);
    setSelectedProductIdToAdd('');
    toast.success(`${prod.name} berhasil ditambahkan ke pesanan`);
  };

  const handleSaveEdit = async () => {
    if (!editPickupDate) {
      toast.error('Tanggal pengambilan wajib diisi');
      return;
    }

    const qtyValid = editItems.every(item => item.quantity >= 30);
    if (!qtyValid) {
      toast.error('Minimal pemesanan untuk setiap item adalah 30 pcs');
      return;
    }

    if (editItems.length === 0) {
      toast.error('Pesanan harus memiliki minimal 1 produk');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await editOrder(order.id, {
        pickup_date: editPickupDate,
        pickup_time: editPickupTime || undefined,
        notes: editNotes,
        items: editItems
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success('Pesanan berhasil diubah');
      setIsEditModalOpen(false);
      
      const newTotal = editItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
      setOrder((prev: any) => ({
        ...prev,
        pickup_date: editPickupDate,
        pickup_time: editPickupTime,
        notes: editNotes,
        subtotal: newTotal,
        total_amount: newTotal
      }));
      
      setOrderItems(editItems.map((item, idx) => ({
        id: `local-${idx}`,
        order_id: order.id,
        ...item,
        subtotal: item.product_price * item.quantity
      })));

      const newHistoryItem = {
        id: `local-hist-${Date.now()}`,
        order_id: order.id,
        new_status: 'pending_payment',
        note: 'Detail pesanan diperbarui oleh pelanggan',
        created_at: new Date().toISOString()
      };
      setHistory((prev: any[]) => [newHistoryItem, ...prev]);

      router.refresh();
    } catch (err: any) {
      console.error('Error saving edits:', err);
      toast.error(err.message || 'Gagal mengubah pesanan');
    } finally {
      setSavingEdit(false);
    }
  };
  
  // Calculate lead times and minimum date
  const now = new Date();
  const cutoffTime = storeSettings?.cutoff_time || '18:00:00';
  const cutoffParts = cutoffTime.split(':');
  
  const cutoffDateTime = setMinutes(setHours(new Date(), parseInt(cutoffParts[0], 10)), parseInt(cutoffParts[1] || '0', 10));
  
  const leadDays = storeSettings?.minimum_lead_days || 3;
  let minDate = addDays(now, leadDays);
  
  if (isAfter(now, cutoffDateTime)) {
    minDate = addDays(now, leadDays + 1);
  }
  
  const minDateStr = format(minDate, 'yyyy-MM-dd');

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
  const getStepStatus = (stepId: string, index: number) => {
    if (order.status === 'cancelled') {
       if (index === 0) return 'completed';
       return 'cancelled';
    }
    
    if (index < currentStatusIndex || order.status === 'completed') return 'completed';
    if (index === currentStatusIndex) return 'current';
    return 'upcoming';
  };

  const getStatusLabel = (status: string) => {
    const found = STATUS_STEPS.find(s => s.id === status);
    if (found) return found.label;
    if (status === 'payment_accepted') return 'Pembayaran Diterima';
    if (status === 'cancelled') return 'Dibatalkan';
    return status;
  };

  const handleWhatsApp = () => {
     if (!storeSettings?.whatsapp_admin) return;

     const text = generateWhatsAppMessage(order.status, order, 'customer_to_admin');
     const normalizedAdminPhone = normalizePhone(storeSettings.whatsapp_admin);
     const url = getWhatsAppURL(normalizedAdminPhone, text);
     
     window.open(url, '_blank');
  };

  // Determine if we should show the generic "Hubungi Admin" button or "Konfirmasi Pengambilan"
  const isReadyForPickup = order.status === 'ready_for_pickup';

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-bold text-gray-900">Status Pesanan</h1>
        <p className="text-sm text-gray-500">Order #{order.order_number}</p>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-900">Timeline</h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#C96A3D]'}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-gray-100">
          {STATUS_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(step.id, index);
            const Icon = step.icon;
            
            let iconColor = 'text-gray-400';
            let bgColor = 'bg-white border-2 border-gray-200';
            
            if (stepStatus === 'completed') {
              iconColor = 'text-white';
              bgColor = 'bg-[#C96A3D] border-2 border-[#C96A3D]';
            } else if (stepStatus === 'current') {
              iconColor = 'text-[#C96A3D]';
              bgColor = 'bg-white border-2 border-[#C96A3D]';
            } else if (stepStatus === 'cancelled') {
              iconColor = 'text-red-400';
              bgColor = 'bg-white border-2 border-red-200';
              if (index === currentStatusIndex) {
                 iconColor = 'text-white';
                 bgColor = 'bg-red-500 border-2 border-red-500';
              }
            }

            return (
              <div key={step.id} className="relative z-10 flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 -ml-[23px] ${bgColor} transition-colors`}>
                  {stepStatus === 'cancelled' && index === currentStatusIndex ? (
                    <XCircle className={`w-3.5 h-3.5 ${iconColor}`} />
                  ) : stepStatus === 'completed' ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${iconColor}`} />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className={`text-sm font-semibold ${stepStatus === 'current' ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                  {/* Show history note if matches */}
                  {history.find(h => h.new_status === step.id) && (
                     <div className="text-xs text-gray-500 mt-0.5">
                       {format(new Date(history.find(h => h.new_status === step.id).created_at), 'd MMM yyyy, HH:mm', { locale: id })}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <h2 className="font-semibold text-gray-900">Rincian Pesanan</h2>
        
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tanggal Pengambilan</span>
            <span className="font-medium text-gray-900">{format(new Date(order.pickup_date), 'd MMMM yyyy', { locale: id })}</span>
          </div>
          {order.pickup_time && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Waktu Pengambilan</span>
              <span className="font-medium text-gray-900">{order.pickup_time.substring(0, 5)} WIB</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Informasi Pemesan</span>
            <span className="font-medium text-gray-900 text-right">{order.customer_name}<br/>{normalizePhone(order.customer_phone)}</span>
          </div>
          {order.notes && (
            <div className="flex flex-col mt-2 p-3 bg-gray-50 rounded-[8px] text-sm">
              <span className="text-gray-500 font-medium mb-1">Catatan:</span>
              <span className="text-gray-900 italic">{order.notes}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col space-y-3">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{item.product_name}</span>
                <div className="text-gray-500">{item.quantity} pcs x Rp {item.product_price.toLocaleString('id-ID')}</div>
              </div>
              <span className="font-medium text-gray-900">Rp {item.subtotal.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg font-bold">
          <span className="text-gray-900">Total</span>
          <span className="text-[#C96A3D]">Rp {order.total_amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {order.status === 'pending_payment' && (
        <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col gap-4">
          <button
            onClick={() => router.push(`/payment/${order.id}`)}
            className="w-full bg-[#C96A3D] text-white py-4 rounded-[12px] font-extrabold text-center hover:bg-orange-700 transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
          >
            Lanjutkan Pembayaran
          </button>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOpenEditModal}
              className="flex-1 border border-[#C96A3D] text-[#C96A3D] py-3.5 rounded-[12px] font-bold text-center hover:bg-orange-50 transition flex items-center justify-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Ubah Detail Pesanan
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 border border-red-200 text-red-600 py-3.5 rounded-[12px] font-bold text-center hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
            </button>
          </div>
        </div>
      )}

      {isReadyForPickup && (
        <button 
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] text-white py-3.5 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Hubungi Admin via WhatsApp
        </button>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C96A3D]" />
                Ubah Detail Pesanan
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pickup Date Input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Pengambilan
                </label>
                <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs text-[#C96A3D] leading-relaxed mb-1">
                  Pemesanan di atas jam {cutoffParts[0]}:{cutoffParts[1]} akan diproses hari berikutnya (H+{leadDays+1}).
                </div>
                <input
                  type="date"
                  value={editPickupDate}
                  min={minDateStr}
                  onChange={(e) => setEditPickupDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C96A3D]"
                  required
                />
              </div>

              {/* Pickup Time Input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Waktu Pengambilan (Opsional)
                </label>
                <input
                  type="time"
                  value={editPickupTime}
                  onChange={(e) => setEditPickupTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C96A3D]"
                />
              </div>

              {/* Notes Input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Catatan Tambahan
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Minta dikemas rapi"
                  className="w-full min-h-[60px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C96A3D]"
                />
              </div>

              {/* Products/Items Editor */}
              <div className="flex flex-col space-y-2 border-t border-gray-100 pt-4">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Item Pesanan (Min. 30 pcs per item)
                </label>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {editItems.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{item.product_name}</div>
                        <div className="text-xs text-gray-500">Rp {item.product_price.toLocaleString('id-ID')} / pc</div>
                        <div className="text-xs font-bold text-[#C96A3D] mt-0.5">
                          Subtotal: Rp {(item.product_price * item.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleEditItemDecrement(item.product_id)}
                            disabled={item.quantity <= 30}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 transition disabled:opacity-30"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => handleEditItemQtyChange(item.product_id, e.target.value)}
                            onBlur={(e) => handleEditItemQtyBlur(item.product_id, parseInt(e.target.value, 10))}
                            className="w-10 text-center text-sm font-semibold text-gray-800 border-none bg-transparent focus:outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditItemIncrement(item.product_id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(item.product_id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Product Dropdown Selector */}
                {loadingProducts ? (
                  <div className="text-xs text-gray-500 italic py-2">Memuat daftar kue...</div>
                ) : (
                  <div className="border border-gray-100 p-3 rounded-xl space-y-2 bg-gray-50/50 mt-2">
                    <label className="text-[10px] font-extrabold text-[#C96A3D] tracking-wider block uppercase">TAMBAH KUE KE PESANAN</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedProductIdToAdd}
                        onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#C96A3D]"
                      >
                        <option value="">-- Pilih Produk Kue --</option>
                        {availableProducts
                          .filter(p => !editItems.some(item => item.product_id === p.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - Rp {p.price.toLocaleString('id-ID')}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddProductToEdit}
                        disabled={!selectedProductIdToAdd}
                        className="bg-[#C96A3D] text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-[#b05a30] disabled:opacity-50 transition shrink-0"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total Preview */}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Total Harga Baru</span>
              <span className="text-lg font-extrabold text-[#C96A3D]">
                Rp {editItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 bg-[#C96A3D] text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-700 transition disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={savingEdit}
                className="px-4 py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition border border-gray-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
