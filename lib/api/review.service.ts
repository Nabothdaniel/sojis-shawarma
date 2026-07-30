import apiClient from './client';

export interface ProductReview {
  id: number;
  user_id: number;
  order_id: string | number;
  product_id: string;
  product_name: string;
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
  createReview: (payload: {
    order_id: string | number;
    product_id: string;
    rating: number;
    review_text?: string;
  }) => apiClient.post('/reviews', payload),
  getAllReviews: (): Promise<{ status: string; data: ProductReview[] }> => apiClient.get('/reviews'),
};
