import apiClient from './client';

export interface VirtualAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  Reserved_Account_Id?: string;
}

export interface VirtualAccountResponse {
  status: string;
  bankAccounts: VirtualAccount[];
  customer: {
    customer_name: string;
    customer_email: string;
    customer_phone_number: string;
  };
}

export const paymentService = {
  /**
   * Get (or create) the logged-in user's dedicated virtual bank account.
   * The backend caches results so the Payment Point API is only called once per user.
   */
  getVirtualAccount: (): Promise<VirtualAccountResponse> =>
    apiClient.get('/payment/virtual-account'),
};
