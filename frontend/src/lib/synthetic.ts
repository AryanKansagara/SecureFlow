import type { TransactionPayload } from "../types";

const MERCHANTS = [
  { id: "M001", name: "Amazon", category: "retail" },
  { id: "M002", name: "Starbucks", category: "food" },
  { id: "M003", name: "Shell", category: "fuel" },
  { id: "M004", name: "Walmart", category: "retail" },
  { id: "M005", name: "Netflix", category: "entertainment" },
  { id: "M006", name: "Uber", category: "transport" },
  { id: "M007", name: "Best Buy", category: "electronics" },
  { id: "M008", name: "McDonald's", category: "food" },
  { id: "M009", name: "Apple", category: "electronics" },
  { id: "M010", name: "Target", category: "retail" },
];

const COUNTRIES = ["US", "CA", "GB", "DE", "FR", "MX", "BR", "IN", "JP", "AU"];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD"];

let txCounter = 0;

// In demo mode, use a fixed "foreign" country so backend sees geographic anomaly (user home often US from normal tx)
const DEMO_FOREIGN_COUNTRY = "JP";

/** Generate one synthetic transaction. Optionally inject fraud-like patterns. */
export function generateSyntheticTransaction(
  options?: { injectFraud?: "high_amount" | "new_country" | "velocity" }
): TransactionPayload {
  txCounter += 1;
  const userNum = (txCounter % 20) + 1;
  const user_id = `user_${userNum}`;
  const device_id = `dev_${userNum}`;

  const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  let amount: number;
  let country: string;
  const now = new Date();

  if (options?.injectFraud === "high_amount") {
    amount = 1200 + Math.random() * 2500; // well above default avg 85 -> ratio > 10
    country = DEMO_FOREIGN_COUNTRY; // so geo anomaly fires (user home often set from normal tx)
  } else if (options?.injectFraud === "new_country") {
    amount = 20 + Math.random() * 80;
    country = DEMO_FOREIGN_COUNTRY;
  } else {
    amount = 10 + Math.random() * 150;
    country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  }

  return {
    amount: Math.round(amount * 100) / 100,
    currency: CURRENCIES[0],
    merchant_id: merchant.id,
    merchant_category: merchant.category,
    country,
    timestamp: now.toISOString(),
    user_id,
    device_id,
  };
}

/** Decide whether to inject a fraud pattern. When demoMode is true, ~60% of tx are fraud so you get flags fast. */
export function maybeInjectFraud(demoMode?: boolean): "high_amount" | "new_country" | undefined {
  const r = Math.random();
  if (demoMode) {
    if (r < 0.5) return "high_amount";
    if (r < 0.6) return "new_country";
    return undefined;
  }
  if (r < 0.04) return "high_amount";
  if (r < 0.08) return "new_country";
  return undefined;
}
