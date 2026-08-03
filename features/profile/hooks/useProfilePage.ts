'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  authService,
  biometricService,
  favoritesService,
  catalogService,
  feedbackService,
  orderService,
  reviewService,
  userService,
  type FavoriteProduct,
  type Order,
} from '@/lib/api';
import { auth } from '@/lib/firebase/config';
import { getGenericProductImage } from '@/lib/menu';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import {
  activeStatuses,
  statusCopy,
  type ProfileTab,
} from '../utils/profile-view-model';

type ReviewDraft = { rating: number; review_text: string };
type FeedbackDraft = { rating: number; message: string };
type ProfileData = {
  id?: string | number;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: 'user' | 'admin' | null;
  biometric_id?: string | null;
};

export function useProfilePage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const {
    user,
    token: persistedToken,
    hasHydrated,
    logout,
    addToast,
    notifications: appNotifications,
    setUser,
  } = useAppStore();
  const addItems = useCartStore((state) => state.addItems);

  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [submittingReviewKey, setSubmittingReviewKey] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>({
    rating: 5,
    message: '',
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSettingUpBiometrics, setIsSettingUpBiometrics] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const effectiveToken = token || persistedToken;
  const isSignedIn = hasHydrated && Boolean(effectiveToken || user);

  useEffect(() => {
    if (authLoading) {
      return; 
    }
    
    if (!effectiveToken || !auth.currentUser) {
      setProfile(null);
      setOrders([]);
      setFavorites([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfileData = async () => {
      setLoading(true);
      setLoadTimeout(false);

      const [profileResult, ordersResult, favoritesResult, catalogResult] = await Promise.allSettled([
        userService.getProfile(),
        effectiveToken ? orderService.getAllOrders('all', useAppStore.getState().user?.id) : Promise.resolve({status: 'success', data: []}),
        favoritesService.getFavorites(),
        catalogService.getProducts()
      ]);

      if (cancelled) {
        return;
      }

      if (profileResult.status === 'fulfilled') {
        const nextProfile = (profileResult.value.data ?? profileResult.value) as ProfileData;
        setProfile(nextProfile);
        const latestUser = useAppStore.getState().user;

        if (nextProfile?.name) {
          setUser({
            id: String(nextProfile.id ?? latestUser?.id ?? ''),
            name: String(nextProfile.name),
            username:
              typeof nextProfile.username === 'string' || nextProfile.username === null
                ? nextProfile.username
                : latestUser?.username ?? null,
            email:
              typeof nextProfile.email === 'string'
                ? nextProfile.email
                : latestUser?.email,
            phone:
              typeof nextProfile.phone === 'string'
                ? nextProfile.phone
                : latestUser?.phone,
            address:
              typeof nextProfile.address === 'string'
                ? nextProfile.address
                : latestUser?.address,
            role:
              nextProfile.role === 'admin' ? 'admin' : latestUser?.role ?? 'user',
            balance: latestUser?.balance,
          });
        }
      } else {
        addToast(
          profileResult.reason?.message || 'Could not load your profile details',
          'error'
        );
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(Array.isArray(ordersResult.value.data) ? ordersResult.value.data : []);
      } else {
        setOrders([]);
        addToast(
          ordersResult.reason?.message || 'Could not load your order history',
          'error'
        );
      }

      if (favoritesResult.status === 'fulfilled' && catalogResult.status === 'fulfilled') {
        const favIds = (favoritesResult.value.data || []).map((f: any) => String(f.id));
        const allProducts = catalogResult.value;
        const populatedFavorites = favIds
          .map(id => allProducts.find(p => String(p.id) === id))
          .filter(Boolean) as FavoriteProduct[];
        setFavorites(populatedFavorites);
      } else {
        setFavorites([]);
      }

      setLoading(false);
    };

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [effectiveToken, addToast, setUser]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const displayName =
    !hasHydrated
      ? '...'
      : (profile?.name as string | undefined) ||
        user?.name ||
        (isSignedIn ? 'Loading profile...' : 'Guest User');
  const displayPhone =
    (profile?.phone as string | undefined) ||
    user?.phone ||
    'Add a phone number when you place an order';
  const displayAddress =
    (profile?.address as string | undefined) ||
    user?.address ||
    'No saved delivery address yet';

  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.includes(order.status)),
    [orders]
  );

  const pastOrders = useMemo(
    () => orders.filter((order) => ['delivered', 'cancelled'].includes(order.status)),
    [orders]
  );

  const notifications = useMemo(() => {
    const derivedNotifications = [...orders]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 6)
      .map((order) => ({
        ...statusCopy[order.status],
        id: order.id,
        orderRef: order.order_ref,
        timestamp: order.updated_at,
        read: true,
        type: 'order_status' as const,
        eventKey: `${order.status}:${order.id}:${order.updated_at}`,
      }));

    const liveNotifications = appNotifications.map((notification) => ({
      id: notification.orderId ?? notification.id,
      orderRef: notification.orderRef ?? 'Update',
      timestamp: notification.timestamp,
      title: notification.title,
      body: notification.body,
      icon: notification.icon || 'notifications',
      read: notification.read,
      type: notification.type,
      eventKey: notification.eventKey,
    }));

    const merged = [...liveNotifications, ...derivedNotifications];
    const seen = new Set<string>();

    return merged
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .filter((notification) => {
        const key =
          notification.eventKey ||
          `${notification.orderRef}:${notification.title}:${notification.timestamp}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  }, [appNotifications, orders]);

  const handleReorder = (order: Order) => {
    const itemsToCart = order.items.map((item) => ({
      id: String(item.id),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      image: getGenericProductImage(),
    }));

    addItems(itemsToCart);
    addToast(`Items from ${order.order_ref} added to cart`, 'success');
    router.push('/cart');
  };

  const handleSetupBiometrics = async () => {
    if (!profile?.id || !profile?.email) {
      return;
    }

    setIsSettingUpBiometrics(true);
    try {
      await biometricService.register(String(profile.id), String(profile.email));
      addToast('Fingerprint registered! You can now log in faster.', 'success');
      setProfile((current) =>
        current ? { ...current, biometric_id: 'configured' } : current
      );
    } catch (error: any) {
      addToast(
        error.message || 'Setup failed. Make sure your device supports biometrics.',
        'error'
      );
    } finally {
      setIsSettingUpBiometrics(false);
    }
  };

  const handleRemoveBiometrics = async () => {
    if (!confirm('Are you sure you want to disable biometric login?')) {
      return;
    }

    try {
      await biometricService.removeBiometrics();
      addToast('Biometric login disabled', 'success');
      setProfile((current) => (current ? { ...current, biometric_id: null } : current));
    } catch (error: any) {
      addToast(error.message || 'Could not remove biometrics', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore server logout failure and clear client session anyway.
    }

    logout();
    router.replace('/login');
  };

  const submitReview = async (order: Order, item: Order['items'][number]) => {
    const reviewKey = `${order.id}:${item.id}`;
    const draft = reviewDrafts[reviewKey] || { rating: 5, review_text: '' };

    setSubmittingReviewKey(reviewKey);
    try {
      await reviewService.createReview({
        order_id: order.id,
        product_id: String(item.id),
        rating: draft.rating,
        review_text: draft.review_text,
      });

      setOrders((current) =>
        current.map((candidate) =>
          candidate.id === order.id
            ? {
                ...candidate,
                reviewed_product_ids: [
                  ...(candidate.reviewed_product_ids || []),
                  String(item.id),
                ],
              }
            : candidate
        )
      );
      addToast('Thanks for the review', 'success');
    } catch (error: any) {
      addToast(error.message || 'Could not save review', 'error');
    } finally {
      setSubmittingReviewKey(null);
    }
  };

  const removeFavorite = async (productId: string | number) => {
    try {
      await favoritesService.toggleFavorite(productId);
      setFavorites((current) => current.filter((favorite) => favorite.id !== productId));
      addToast('Removed from favorites', 'info');
    } catch {
      addToast('Could not remove', 'error');
    }
  };

  const submitFeedback = async () => {
    setIsSubmittingFeedback(true);
    try {
      await feedbackService.submitFeedback({
        name: user?.name || 'Guest',
        email: user?.email || undefined,
        rating: feedbackDraft.rating,
        message: feedbackDraft.message,
      });
      addToast('Thanks for your feedback!', 'success');
      setFeedbackDraft({ rating: 5, message: '' });
      setActiveTab('profile');
    } catch (error: any) {
      addToast(error.message || 'Could not send feedback', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const updateProfileDetails = async (data: { phone: string; address: string; name: string }) => {
    setIsUpdatingProfile(true);
    try {
      await userService.updateProfile(data);
      setProfile((current) => (current ? { ...current, ...data } : current) as ProfileData);
      if (user) setUser({ ...user, ...data });
      addToast('Profile updated successfully!', 'success');
      return true;
    } catch (error: any) {
      addToast(error.message || 'Could not update profile', 'error');
      return false;
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return {
    activeOrders,
    activeTab,
    authLoading,
    displayAddress,
    displayName,
    displayPhone,
    favorites,
    feedbackDraft,
    handleLogout,
    handleRemoveBiometrics,
    handleReorder,
    handleSetupBiometrics,
    hasHydrated,
    isSettingUpBiometrics,
    isSignedIn,
    isSubmittingFeedback,
    loadTimeout,
    loading,
    notifications,
    orders,
    pastOrders,
    profile,
    removeFavorite,
    reviewDrafts,
    setActiveTab,
    setFeedbackDraft,
    setReviewDrafts,
    statusCopy,
    submitFeedback,
    submitReview,
    submittingReviewKey,
    updateProfileDetails,
    isUpdatingProfile,
    user,
  };
}
