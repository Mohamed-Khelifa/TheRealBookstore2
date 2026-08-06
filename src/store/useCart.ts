import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bookId: string) => void;
  updateQty: (bookId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.book_id === newItem.book_id);

        if (existingItem) {
          set({
            items: currentItems.map(item =>
              item.book_id === newItem.book_id
                ? { ...item, qty: item.qty + newItem.qty }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, newItem] });
        }
      },
      removeItem: (bookId) => {
        set({ items: get().items.filter(item => item.book_id !== bookId) });
      },
      updateQty: (bookId, qty) => {
        if (qty <= 0) {
          get().removeItem(bookId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.book_id === bookId ? { ...item, qty } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.qty, 0),
      subtotal: () => get().items.reduce((acc, item) => acc + (item.price * item.qty), 0),
    }),
    {
      name: 'bigdeal-cart-storage',
    }
  )
);