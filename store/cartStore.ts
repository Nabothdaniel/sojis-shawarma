'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === newItem.id && item.size === newItem.size
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += newItem.quantity;
            return { items: newItems };
          }

          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (id, size) => {
        set((state) => ({
          items: state.items.filter((item) => !(item.id === id && item.size === size)),
        }));
      },
      updateQuantity: (id, size, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.size === size ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'soji-shawarma-cart',
    }
  )
);
