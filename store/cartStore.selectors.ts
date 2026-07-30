import { useCartStore } from './cartStore';

export const useCartItems = () => useCartStore((state) => state.items);

export const useAddCartItem = () => useCartStore((state) => state.addItem);

export const useAddCartItems = () => useCartStore((state) => state.addItems);

export const useRemoveCartItem = () => useCartStore((state) => state.removeItem);

export const useUpdateCartQuantity = () => useCartStore((state) => state.updateQuantity);

export const useClearCart = () => useCartStore((state) => state.clearCart);

export const useCartTotalItems = () => useCartStore((state) => state.totalItems);

export const useCartTotalPrice = () => useCartStore((state) => state.totalPrice);
