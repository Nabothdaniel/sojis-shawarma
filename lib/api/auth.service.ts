import apiClient from './client';
import { auth, db } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const authService = {
  login: async (credentials: any) => {
    const email = credentials.identifier;
    const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
    
    // Fetch custom role from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';

    return {
      user: {
        id: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        role: role
      },
      token: await userCredential.user.getIdToken()
    };
  },
  
  register: async (payload: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    
    await updateProfile(userCredential.user, {
      displayName: payload.name
    });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    return {
      user: {
        id: userCredential.user.uid,
        name: payload.name,
        email: payload.email,
        role: 'user'
      },
      token: await userCredential.user.getIdToken()
    };
  },

  resetPassword: async (payload: { email: string }) => {
    await sendPasswordResetEmail(auth, payload.email);
    return { status: 'success', message: 'Password reset link sent to your email.' };
  },
  
  getAdminAccessStatus: async (access?: string) => {
    const docRef = doc(db, 'settings', 'access-link');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { status: 'success', data: { is_enabled: false } };
    const data = docSnap.data();
    return { status: 'success', data: { ...data, isValid: access === data.access_key } };
  },
    
  logout: async () => {
    await signOut(auth);
    return { success: true };
  },
};

