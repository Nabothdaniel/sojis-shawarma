import apiClient from './client';

export interface FeedbackData {
  name: string;
  email?: string;
  rating: number;
  message: string;
}

export const feedbackService = {
  submitFeedback: (data: FeedbackData) => apiClient.post('/feedbacks', data),
  getAllFeedbacks: () => apiClient.get('/feedbacks'),
};
