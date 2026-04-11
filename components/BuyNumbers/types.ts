import { SmsCountry, SmsService, AvailabilityInfo } from '@/lib/api';

export interface BuyNumbersProps { 
  defaultCountry?: string; 
  lockCountry?: boolean;
}

export interface FAQItem {
  id: string;
  title: string;
  content: string;
}
