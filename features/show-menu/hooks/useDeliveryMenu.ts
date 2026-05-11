'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import type { MenuProduct } from '@/lib/menu';
import {
  fetchFavoriteIds,
  fetchMenuProducts,
  toggleFavoriteProduct,
} from '../data/menu.repository';
import {
  filterMenuProducts,
  getMenuCategories,
  getPopularProducts,
} from '../utils/menu-selectors';

export function useDeliveryMenu() {
  const router = useRouter();
  const { install, installAvailable } = useInstallPrompt();
  const addItem = useCartStore((state) => state.addItem);
  const { user, addToast, unreadCount } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);

      try {
        const products = await fetchMenuProducts();
        if (!cancelled) {
          setMenuProducts(products);
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    let cancelled = false;

    fetchFavoriteIds()
      .then((ids) => {
        if (!cancelled) {
          setFavoriteIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFavoriteIds(new Set());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const categories = useMemo(() => getMenuCategories(menuProducts), [menuProducts]);
  const filteredProducts = useMemo(
    () => filterMenuProducts(menuProducts, activeCategory, searchQuery),
    [activeCategory, menuProducts, searchQuery]
  );
  const popularProducts = useMemo(
    () => getPopularProducts(menuProducts),
    [menuProducts]
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayName = user?.name?.split(' ')[0] || 'Guest';

  const handleInstall = async () => {
    await install({
      onUnsupported: () => {
        addToast('Use browser menu to "Add to Home Screen"', 'info');
      },
      onAccepted: () => {
        addToast('App installed successfully!', 'success');
      },
    });
  };

  const handleQuickAdd = (item: MenuProduct) => {
    addItem({ ...item, quantity: 1, size: 'Regular' });
    addToast(`${item.name} added to cart`, 'success');
  };

  const toggleFavorite = async (
    event: React.MouseEvent,
    productId: string | number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      addToast('Sign in to save favorites', 'info');
      router.push('/login');
      return;
    }

    try {
      const response = await toggleFavoriteProduct(productId);
      setFavoriteIds((current) => {
        const next = new Set(current);

        if (response.action === 'added') {
          next.add(Number(productId));
        } else {
          next.delete(Number(productId));
        }

        return next;
      });

      addToast(
        response.action === 'added' ? 'Added to favorites' : 'Removed from favorites',
        response.action === 'added' ? 'success' : 'info'
      );
    } catch {
      addToast('Could not update favorites', 'error');
    }
  };

  return {
    activeCategory,
    categories,
    displayName,
    favoriteIds,
    filteredProducts,
    handleInstall,
    handleQuickAdd,
    installAvailable,
    loadingProducts,
    normalizedSearch,
    popularProducts,
    searchQuery,
    setActiveCategory,
    setSearchQuery,
    toggleFavorite,
    unreadCount,
  };
}
