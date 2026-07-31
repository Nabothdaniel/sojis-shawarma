import { db, auth } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, doc, runTransaction } from 'firebase/firestore';

export interface ProductReview {
  id: string;
  user_id: string;
  order_id: string | number;
  product_id: string;
  product_name?: string;
  rating: number;
  review_text?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  created_at: string;
}

export interface ProductRatingUpdate {
  product_id: string;
  product_name: string;
  average_rating: number;
  review_count: number;
}

export const reviewService = {
  createReview: async (payload: {
    order_id: string | number;
    product_id: string;
    rating: number;
    review_text?: string;
  }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in to review");
    
    const reviewData = {
      ...payload,
      user_id: user.uid,
      user_name: user.displayName || 'Anonymous',
      user_email: user.email || '',
      created_at: new Date().toISOString()
    };
    
    // Add review
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    
    // Update product rating aggregate
    const productRef = doc(db, 'products', payload.product_id);
    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) return;
      
      const product = productSnap.data();
      const newReviewCount = (product.reviewCount || 0) + 1;
      const oldRatingSum = (product.rating || 0) * (product.reviewCount || 0);
      const newRating = (oldRatingSum + payload.rating) / newReviewCount;
      
      transaction.update(productRef, {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newReviewCount
      });
    });

    return { status: 'success', data: { id: docRef.id, ...reviewData } };
  },
  
  getAllReviews: async (): Promise<{ status: string; data: ProductReview[] }> => {
    const q = query(collection(db, 'reviews'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductReview));
    return { status: 'success', data };
  },
};
