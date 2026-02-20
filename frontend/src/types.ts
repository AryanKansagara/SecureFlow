/** Transaction payload sent to the API */
export interface TransactionPayload {
  amount: number;
  currency: string;
  merchant_id: string;
  merchant_category: string;
  country: string;
  region?: string;
  timestamp: string; // ISO
  user_id?: string;
  device_id?: string;
  transaction_id?: string;
}

/** One fraud signal from the backend */
export interface SignalContribution {
  name: string;
  description: string;
  contribution: number;
}

/** Response from POST /api/v1/transactions/evaluate */
export interface EvaluateResponse {
  transaction_id: string;
  score: number;
  flagged: boolean;
  latency_ms: number;
  threshold: number;
  signals?: SignalContribution[];
  explanation?: string;
  recommendation?: string;
}

/** Row shown in the stream (payload + response) */
export interface TransactionResult {
  payload: TransactionPayload;
  response: EvaluateResponse;
  clientTimestamp: number;
}
