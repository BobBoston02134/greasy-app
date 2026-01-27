export interface DonationFlowState {
  amount: number | null;
  timeframe: string | null;
  recipient: string | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
  wantsMotivation: boolean | null;
  antiCharity: string | null;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
}

export interface CreateCustomerResponse {
  customerId: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  recipient: string;
  timeframe: string;
  customerId?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
}
