import apiClient from './client';

export interface FeedbackData {
  name: string;
  email?: string;
  rating: number;
  message: string;
}

export interface FeedbackItem extends FeedbackData {
  id: number;
  user_id?: number | null;
  created_at: string;
}

export const feedbackService = {
  submitFeedback: (data: FeedbackData) => apiClient.post('/feedbacks', data),
  getAllFeedbacks: () => apiClient.get('/feedbacks'),
};
