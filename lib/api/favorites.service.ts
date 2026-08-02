import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export interface FavoriteProduct {
  id: string | number;
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

const LOCAL_STORAGE_KEY = 'sojis_favorites';

const getLocalFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const setLocalFavorites = (favorites: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
};

export const favoritesService = {
  getFavorites: async (): Promise<FavoritesResponse> => {
    const user = auth.currentUser;
    if (!user) {
      const localFavs = getLocalFavorites();
      return {
        status: 'success',
        data: localFavs.map(id => ({ id }))
      };
    }

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { status: 'success', data: [] };
    }

    const favorites = userSnap.data().favorite_products || [];
    return {
      status: 'success',
      data: favorites.map((id: number | string) => ({ id: String(id) }))
    };
  },

  toggleFavorite: async (productId: number | string): Promise<FavoriteToggleResponse> => {
    const user = auth.currentUser;
    const strProductId = String(productId);

    if (!user) {
      const localFavs = getLocalFavorites();
      const isFavorite = localFavs.includes(strProductId);
      if (isFavorite) {
        setLocalFavorites(localFavs.filter(id => id !== strProductId));
        return { status: 'success', action: 'removed' };
      } else {
        setLocalFavorites([...localFavs, strProductId]);
        return { status: 'success', action: 'added' };
      }
    }

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let isFavorite = false;
    if (userSnap.exists()) {
      const favorites = userSnap.data().favorite_products || [];
      isFavorite = favorites.some((id: string | number) => String(id) === strProductId);
    } else {
      // If user doc somehow doesn't exist, this will throw when updating, but should be rare.
      // Usually users are created on signup.
    }

    if (isFavorite) {
      // Remove both string and number variants just in case previously stored as a number
      const toRemove = isNaN(Number(strProductId)) 
        ? arrayRemove(strProductId) 
        : arrayRemove(strProductId, Number(strProductId));
      
      await setDoc(userRef, {
        favorite_products: toRemove
      }, { merge: true });
      return { status: 'success', action: 'removed' };
    } else {
      await setDoc(userRef, {
        favorite_products: arrayUnion(strProductId)
      }, { merge: true });
      return { status: 'success', action: 'added' };
    }
  },
};
