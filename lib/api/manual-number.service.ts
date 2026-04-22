import apiClient from './client';
import { TelegramNumber } from '@/types';

export type TelegramNumberItem = TelegramNumber;

export const manualNumberService = {
  getAvailableTelegram: (search = ''): Promise<{ status: string; data: TelegramNumberItem[] }> =>
    apiClient.get(`/manual-numbers/telegram?search=${encodeURIComponent(search)}`),

  getMyTelegramNumbers: (): Promise<{ status: string; data: TelegramNumberItem[] }> =>
    apiClient.get('/manual-numbers/telegram/mine'),

  purchaseTelegram: (numberId: number, pin: string): Promise<{ status: string; message: string; data: any }> =>
    apiClient.post('/manual-numbers/telegram/purchase', { numberId, pin }),

  requestTelegramCancellation: (numberId: number, reason: string): Promise<{ status: string; message: string; data: { requestId: number } }> =>
    apiClient.post('/manual-numbers/telegram/cancel-request', { numberId, reason }),
};
