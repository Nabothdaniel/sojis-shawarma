import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export interface FeedbackData {
  name: string;
  email?: string;
  rating: number;
  message: string;
}

export interface FeedbackItem extends FeedbackData {
  id: string;
  user_id?: string | null;
  created_at: string;
}

export const feedbackService = {
  submitFeedback: async (data: FeedbackData) => {
    const payload = {
      ...data,
      created_at: new Date().toISOString()
    };
    
    // Firestore won't take undefined variables, sanitize them.
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    
    const docRef = await addDoc(collection(db, 'feedbacks'), sanitizedPayload);
    return { status: 'success', data: { id: docRef.id, ...payload } };
  },
  
  getAllFeedbacks: async () => {
    const q = query(collection(db, 'feedbacks'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { status: 'success', data };
  },
};
