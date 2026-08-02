import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/context/AuthContext';
import { orderService, userService, type PaymentSettings } from '@/lib/api';
import type { Order } from '@/lib/api';
import { CheckoutStep, ProfileData, CheckoutFormData } from '../types';

function mergeDeliveryDetails(
  current: CheckoutFormData,
  sources: Array<{ name?: string | null; phone?: string | null; address?: string | null; } | null | undefined>
) {
  const next = { ...current };
  for (const source of sources) {
    if (!source) continue;
    if (!next.name && source.name) next.name = source.name;
    if (!next.phone && source.phone) next.phone = source.phone;
    if (!next.address && source.address) next.address = source.address;
  }
  return next;
}

export function useCheckout() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { user, token: persistedToken, hasHydrated, addToast, setUser } = useAppStore();
  const { items, totalPrice, clearCart } = useCartStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [hasAttemptedAutofill, setHasAttemptedAutofill] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', note: '', orderType: 'delivery',
    pickupTime: '', paymentMethod: 'bank_transfer', paymentReference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isPromoLoading, setIsPromoLoading] = useState(false);

  const effectiveToken = token || persistedToken;
  const isSignedIn = hasHydrated && Boolean(effectiveToken || user);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!hasHydrated || !isSignedIn) return;
    setFormData((current) => mergeDeliveryDetails(current, [user, profileData]));
  }, [hasHydrated, isSignedIn, profileData, user]);

  useEffect(() => {
    if (!hasHydrated || !isSignedIn || !effectiveToken || hasAttemptedAutofill) return;
    let cancelled = false;

    const hydrateDeliveryDetails = async () => {
      setHasAttemptedAutofill(true);
      try {
        const [profileResponse, ordersResponse] = await Promise.allSettled([
          userService.getProfile(), orderService.getAllOrders(),
        ]);
        if (cancelled) return;

        let fetchedProfile: ProfileData | null = null;
        let latestOrder: Order | null = null;

        if (profileResponse.status === 'fulfilled') {
          const data = profileResponse.value?.data ?? profileResponse.value;
          if (data && typeof data === 'object') {
            fetchedProfile = data as ProfileData;
            setProfileData(fetchedProfile);
            if (fetchedProfile.name) {
              setUser({
                id: String(fetchedProfile.id ?? user?.id ?? ''),
                name: String(fetchedProfile.name),
                username: user?.username ?? null,
                email: typeof fetchedProfile.email === 'string' ? fetchedProfile.email : user?.email,
                phone: typeof fetchedProfile.phone === 'string' ? fetchedProfile.phone : user?.phone,
                address: typeof fetchedProfile.address === 'string' ? fetchedProfile.address : user?.address,
                role: user?.role ?? 'user',
                balance: user?.balance,
              });
            }
          }
        }
        if (ordersResponse.status === 'fulfilled') {
          const orders = Array.isArray(ordersResponse.value?.data) ? ordersResponse.value.data : [];
          latestOrder = orders[0] ?? null;
        }

        setFormData((current) => mergeDeliveryDetails(current, [
          user, fetchedProfile,
          latestOrder ? { name: latestOrder.customer_name, phone: latestOrder.customer_phone, address: latestOrder.delivery_address } : null,
        ]));
      } catch (error) {
        if (!cancelled) console.error('Auto-fill fetch failed', error);
      }
    };
    hydrateDeliveryDetails();
    return () => { cancelled = true; };
  }, [effectiveToken, hasAttemptedAutofill, hasHydrated, isSignedIn, setUser, user]);

  useEffect(() => {
    let cancelled = false;
    const loadPaymentSettings = async () => {
      try {
        const response = await orderService.getPaymentSettings();
        if (!cancelled) setPaymentSettings(response.data);
      } catch (error) {
        if (!cancelled) console.error('Could not load payment settings', error);
      }
    };
    loadPaymentSettings();
    return () => { cancelled = true; };
  }, []);

  const subtotal = totalPrice();
  const deliveryFee = formData.orderType === 'delivery' ? (paymentSettings?.delivery_fee || 0) : 0;
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      discountAmount = (subtotal + deliveryFee) * (appliedPromo.discount_value / 100);
    } else {
      discountAmount = appliedPromo.discount_value;
    }
  }
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    setIsPromoLoading(true);
    try {
      const response = await orderService.validatePromoCode(promoCodeInput.trim());
      setAppliedPromo(response.data);
      addToast('Promo code applied successfully!', 'success');
    } catch (error: any) {
      setAppliedPromo(null);
      addToast(error.message || 'Invalid promo code', 'error');
    } finally {
      setIsPromoLoading(false);
    }
  };

  const { mutate: placeOrder, isPending: isLoading } = useMutation({
    mutationFn: (orderData: any) => orderService.createOrder(orderData),
    onSuccess: (response: any) => {
      const result = response?.data ?? response;
      if (!result?.id || !result?.order_ref) return addToast('Order created, but response incomplete', 'error');
      setOrderId(result.id); setOrderRef(result.order_ref);
      setCurrentStep(formData.paymentMethod === 'cash_on_pickup' ? 'success' : 'payment');
      addToast(formData.paymentMethod === 'cash_on_pickup' ? 'Order submitted. Wait for admin.' : 'Proceed with payment.', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Error creating order', 'error'),
  });

  const { mutate: confirmPayment, isPending: isConfirming } = useMutation({
    mutationFn: async () => {
      if (!orderId || !receiptFile) throw new Error('Missing order or receipt');
      const uploadData = new FormData();
      uploadData.append('receipt', receiptFile);
      if (formData.paymentReference.trim()) uploadData.append('payment_reference', formData.paymentReference.trim());
      return orderService.confirmPayment(orderId, uploadData);
    },
    onSuccess: () => {
      setCurrentStep('success'); clearCart();
      addToast('Payment proof submitted. Await admin confirmation.', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Error confirming payment', 'error'),
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number format';
    
    if (formData.orderType === 'delivery' && !formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (formData.orderType === 'pickup' && !formData.pickupTime.trim()) newErrors.pickupTime = 'Pickup time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return addToast('Cart is empty', 'error');
    if (!validateForm()) return addToast('Please fix the errors in the form', 'error');

    placeOrder({
      customer_name: formData.name.trim(),
      customer_phone: formData.phone.trim(),
      delivery_address: formData.orderType === 'pickup' ? (paymentSettings?.pickup_address || 'Pickup') : formData.address.trim(),
      order_type: formData.orderType,
      payment_method: formData.paymentMethod,
      pickup_time: formData.orderType === 'pickup' ? formData.pickupTime.trim() : '',
      items, total_amount: grandTotal,
      payment_reference: formData.paymentReference.trim() || undefined,
      notes: formData.note.trim(), payment_status: 'pending',
      user_id: user?.id || null,
      promo_code: appliedPromo ? appliedPromo.code : undefined,
    });
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) return addToast('Please upload receipt image', 'error');
    confirmPayment();
  };

  return {
    router, isMounted, authLoading, hasHydrated, isSignedIn,
    currentStep, setCurrentStep, addToast,
    formData, setFormData, errors, setErrors,
    receiptFile, setReceiptFile, isGeoLoading, setIsGeoLoading,
    paymentSettings, orderId, orderRef, subtotal, grandTotal, discountAmount, deliveryFee, items,
    promoCodeInput, setPromoCodeInput, appliedPromo, setAppliedPromo, isPromoLoading, applyPromo,
    isLoading, isConfirming, handlePlaceOrder, handleReceiptUpload, clearCart
  };
}
