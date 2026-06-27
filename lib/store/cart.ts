import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartState {
  itemsByUserId: Record<string, CartItem[]>;
  addItem: (userId: string, item: CartItem) => Promise<void>;
  removeItem: (userId: string, productId: string) => Promise<void>;
  updateQuantity: (userId: string, productId: string, quantity: number) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
  getItems: (userId: string | null | undefined) => CartItem[];
  getCartTotal: (userId: string | null | undefined) => number;
  fetchCart: (userId: string) => Promise<void>;
}

const EMPTY_ARRAY: CartItem[] = [];

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itemsByUserId: {},
      
      fetchCart: async (userId) => {
        if (!userId) return;
        try {
          const supabase = createClientComponentClient();
          const { data, error } = await supabase
            .from('carts')
            .select('*, products(image_url)')
            .eq('user_id', userId);

          if (error) {
            console.error('Error fetching cart:', error);
            return;
          }

          const items = (data || []).map((row: any) => ({
            product_id: row.product_id,
            name: row.product_name,
            price: parseFloat(row.product_price),
            image_url: row.products?.image_url || '',
            quantity: row.quantity,
          }));

          set((state) => ({
            itemsByUserId: {
              ...state.itemsByUserId,
              [userId]: items,
            },
          }));
        } catch (err) {
          console.error('Error in fetchCart:', err);
        }
      },

      addItem: async (userId, item) => {
        if (!userId) return;
        try {
          const userItems = get().itemsByUserId[userId] || [];
          const existingItem = userItems.find((i) => i.product_id === item.product_id);
          const newQuantity = existingItem ? (existingItem.quantity + item.quantity) : Math.max(30, item.quantity);
          const subtotal = item.price * newQuantity;

          const supabase = createClientComponentClient();
          const { error } = await supabase
            .from('carts')
            .upsert({
              user_id: userId,
              product_id: item.product_id,
              product_name: item.name,
              product_price: item.price,
              quantity: newQuantity,
              subtotal: subtotal
            }, { onConflict: 'user_id,product_id' });

          if (error) {
            console.error('Error adding/upserting to cart:', error);
            toast.error('Gagal menambahkan produk ke keranjang');
            return;
          }

          set((state) => {
            const currentItems = state.itemsByUserId[userId] || [];
            const isExist = currentItems.find((i) => i.product_id === item.product_id);
            
            if (isExist) {
              return {
                itemsByUserId: {
                  ...state.itemsByUserId,
                  [userId]: currentItems.map((i) => 
                    i.product_id === item.product_id 
                      ? { ...i, quantity: i.quantity + item.quantity }
                      : i
                  )
                }
              };
            }
            
            return {
              itemsByUserId: {
                ...state.itemsByUserId,
                [userId]: [...currentItems, { ...item, quantity: Math.max(30, item.quantity) }]
              }
            };
          });
        } catch (err) {
          console.error('Error in addItem:', err);
        }
      },

      removeItem: async (userId, productId) => {
        if (!userId) return;
        try {
          const supabase = createClientComponentClient();
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

          if (error) {
            console.error('Error removing cart item:', error);
            toast.error('Gagal menghapus produk dari keranjang');
            return;
          }

          set((state) => {
            const userItems = state.itemsByUserId[userId] || [];
            return {
              itemsByUserId: {
                ...state.itemsByUserId,
                [userId]: userItems.filter((i) => i.product_id !== productId)
              }
            };
          });
        } catch (err) {
          console.error('Error in removeItem:', err);
        }
      },

      updateQuantity: async (userId, productId, quantity) => {
        if (!userId) return;
        try {
          const userItems = get().itemsByUserId[userId] || [];
          const item = userItems.find((i) => i.product_id === productId);
          if (!item) return;

          const supabase = createClientComponentClient();
          const subtotal = item.price * quantity;
          const { error } = await supabase
            .from('carts')
            .update({ quantity, subtotal })
            .eq('user_id', userId)
            .eq('product_id', productId);

          if (error) {
            console.error('Error updating cart quantity:', error);
            toast.error('Gagal memperbarui jumlah produk');
            return;
          }

          set((state) => ({
            itemsByUserId: {
              ...state.itemsByUserId,
              [userId]: (state.itemsByUserId[userId] || []).map((i) => 
                i.product_id === productId ? { ...i, quantity } : i
              )
            }
          }));
        } catch (err) {
          console.error('Error in updateQuantity:', err);
        }
      },

      clearCart: async (userId) => {
        if (!userId) return;
        try {
          const supabase = createClientComponentClient();
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', userId);

          if (error) {
            console.error('Error clearing cart:', error);
            toast.error('Gagal mengosongkan keranjang di database');
          }

          set((state) => ({
            itemsByUserId: {
              ...state.itemsByUserId,
              [userId]: []
            }
          }));
        } catch (err) {
          console.error('Error in clearCart:', err);
        }
      },

      getItems: (userId) => {
        if (!userId) return EMPTY_ARRAY;
        return get().itemsByUserId[userId] || EMPTY_ARRAY;
      },

      getCartTotal: (userId) => {
        if (!userId) return 0;
        const items = get().itemsByUserId[userId] || EMPTY_ARRAY;
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'jajan-pasar-cart',
    }
  )
);
