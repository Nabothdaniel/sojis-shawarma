import { db, auth } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");
  return user;
};

const generateRecoveryKey = () => 
  Array.from({length: 4}, () => Math.random().toString(36).substring(2, 6).toUpperCase()).join('-');

export const userService = {
  getProfile: async () => {
    const user = requireUser();
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    return { status: 'success', data: { id: user.uid, ...docSnap.data() } };
  },
  
  getBalance: async () => {
    const user = requireUser();
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    return { status: 'success', data: { balance: docSnap.data()?.balance || 0 } };
  },
  
  getTransactions: async (): Promise<{ status: string; data: any[] }> => {
    const user = requireUser();
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return { status: 'success', data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
  },
  
  updatePin: async (pin: string) => {
    const user = requireUser();
    await updateDoc(doc(db, 'users', user.uid), { pin, has_pin: true });
    return { status: 'success', message: 'PIN updated successfully' };
  },
  
  verifyPin: async (pin: string) => {
    const user = requireUser();
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    const data = docSnap.data();
    if (data?.pin === pin) {
      return { status: 'success', message: 'PIN verified' };
    }
    throw new Error('Invalid PIN');
  },
  
  getSecurityInfo: async () => {
    const user = requireUser();
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    const data = docSnap.data() || {};
    return { status: 'success', data: {
      has_pin: !!data.pin,
      has_recovery_key: !!data.recovery_key,
      whatsapp_notifications: !!data.whatsapp_notifications,
      whatsapp_number: data.whatsapp_number || null,
      two_factor_enabled: !!data.two_factor_enabled,
    }};
  },
  
  updateSecuritySettings: async (data: { whatsapp_notifications: boolean; whatsapp_number?: string }) => {
    const user = requireUser();
    await updateDoc(doc(db, 'users', user.uid), data);
    return { status: 'success', message: 'Security settings updated' };
  },
  
  confirmRecoveryKeySaved: async () => {
    const user = requireUser();
    await updateDoc(doc(db, 'users', user.uid), { recovery_key_saved: true });
    return { status: 'success' };
  },
  
  regenerateRecoveryKey: async (pin: string) => {
    const user = requireUser();
    // Verify pin first
    await userService.verifyPin(pin);
    const newKey = generateRecoveryKey();
    await updateDoc(doc(db, 'users', user.uid), { recovery_key: newKey, recovery_key_saved: false });
    return { status: 'success', data: { recovery_key: newKey } };
  },
  
  revealRecoveryKey: async (pin: string) => {
    const user = requireUser();
    await userService.verifyPin(pin);
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    return { status: 'success', data: { recovery_key: docSnap.data()?.recovery_key } };
  },
};
