import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartState {
  itemsByUserId: Record<string, CartItem[]>;
  addItem: (userId: string, item: CartItem) => void;
  removeItem: (userId: string, productId: string) => void;
  updateQuantity: (userId: string, productId: string, quantity: number) => void;
  clearCart: (userId: string) => void;
  getItems: (userId: string | null | undefined) => CartItem[];
  getCartTotal: (userId: string | null | undefined) => number;
}

const EMPTY_ARRAY: CartItem[] = [];

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itemsByUserId: {},
      addItem: (userId, item) => {
        if (!userId) return;
        set((state) => {
          const userItems = state.itemsByUserId[userId] || [];
          const existingItem = userItems.find((i) => i.product_id === item.product_id);
          
          if (existingItem) {
            return {
              itemsByUserId: {
                ...state.itemsByUserId,
                [userId]: userItems.map((i) => 
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
              [userId]: [...userItems, { ...item, quantity: Math.max(30, item.quantity) }]
            }
          };
        });
      },
      removeItem: (userId, productId) => {
        if (!userId) return;
        set((state) => {
          const userItems = state.itemsByUserId[userId] || [];
          return {
            itemsByUserId: {
              ...state.itemsByUserId,
              [userId]: userItems.filter((i) => i.product_id !== productId)
            }
          };
        });
      },
      updateQuantity: (userId, productId, quantity) => {
        if (!userId) return;
        set((state) => {
          const userItems = state.itemsByUserId[userId] || [];
          return {
            itemsByUserId: {
              ...state.itemsByUserId,
              [userId]: userItems.map((i) => 
                i.product_id === productId ? { ...i, quantity } : i
              )
            }
          };
        });
      },
      clearCart: (userId) => {
         if (!userId) return;
         set((state) => ({
           itemsByUserId: {
             ...state.itemsByUserId,
             [userId]: []
           }
         }));
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
