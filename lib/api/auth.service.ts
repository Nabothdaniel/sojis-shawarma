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
    let role = 'user';
    
    if (userDoc.exists()) {
      role = userDoc.data().role || 'user';
    } else {
      // Heal the missing database record if the account was created during permissions failure
      role = 'user';
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName || email,
          email: email,
          role: role,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Could not heal user document", err);
      }
    }

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
    
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        role: 'user',
        createdAt: new Date().toISOString()
      });
    } catch (firestoreError: any) {
      try {
        await userCredential.user.delete();
      } catch (rollbackError) {
        console.error('Failed to rollback orphaned auth profile:', rollbackError);
      }
      throw new Error(firestoreError.message || 'Registration failed at database initialization. Please retry.');
    }

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

