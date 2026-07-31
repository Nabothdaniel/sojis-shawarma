import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export interface FavoriteProduct {
  id: number;
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  available?: number;
  category_name?: string;
  created_at?: string;
}

export interface FavoritesResponse {
  status: string;
  data: FavoriteProduct[];
}

export interface FavoriteToggleResponse {
  status: string;
  action: 'added' | 'removed';
}

export const favoritesService = {
  getFavorites: async (): Promise<FavoritesResponse> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { status: 'success', data: [] };
    }

    const favorites = userSnap.data().favorite_products || [];
    return {
      status: 'success',
      data: favorites.map((id: number | string) => ({ id: Number(id) }))
    };
  },

  toggleFavorite: async (productId: number | string): Promise<FavoriteToggleResponse> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const numProductId = Number(productId);
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let isFavorite = false;
    if (userSnap.exists()) {
      const favorites = userSnap.data().favorite_products || [];
      isFavorite = favorites.includes(numProductId);
    } else {
      // If user doc somehow doesn't exist, this will throw when updating, but should be rare.
      // Usually users are created on signup.
    }

    if (isFavorite) {
      await updateDoc(userRef, {
        favorite_products: arrayRemove(numProductId)
      });
      return { status: 'success', action: 'removed' };
    } else {
      await updateDoc(userRef, {
        favorite_products: arrayUnion(numProductId)
      });
      return { status: 'success', action: 'added' };
    }
  },
};
