import { Customer } from '../types';

export interface LoyaltyStatus {
  isEligible: boolean;
  daysRemaining: number;
  expiresAtFormatted?: string;
  reason: string;
  lastPurchaseKg?: number;
  lastPurchaseDateFormatted?: string;
}

/**
 * Checks if a customer currently qualifies for the 5% Desi Ghee repeat discount.
 * Rule:
 * - 1 kg of Ghee purchase gives 1 month (30 days) of 5% discount validity.
 * - 2 kg gives 2 months (60 days) of 5% discount validity.
 * - If current date is within the validity window, customer gets 5% off!
 */
export function checkCustomerLoyalty(
  customer?: Customer,
  checkDate: Date = new Date()
): LoyaltyStatus {
  if (!customer) {
    return {
      isEligible: false,
      daysRemaining: 0,
      reason: 'New customer (no previous purchase)',
    };
  }

  if (!customer.loyaltyExpiresAt) {
    return {
      isEligible: false,
      daysRemaining: 0,
      reason: 'No qualifying ghee purchase recorded yet',
    };
  }

  const expiryDate = new Date(customer.loyaltyExpiresAt);
  const now = checkDate.getTime();
  const diffMs = expiryDate.getTime() - now;

  if (diffMs <= 0) {
    return {
      isEligible: false,
      daysRemaining: 0,
      expiresAtFormatted: expiryDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      reason: 'Previous scheme expired',
      lastPurchaseKg: customer.lastGheePurchaseKg,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const expiresAtFormatted = expiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const lastPurchaseDateFormatted = customer.lastGheePurchaseDate
    ? new Date(customer.lastGheePurchaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  return {
    isEligible: true,
    daysRemaining,
    expiresAtFormatted,
    reason: `5% Scheme Active (${daysRemaining} days left)`,
    lastPurchaseKg: customer.lastGheePurchaseKg,
    lastPurchaseDateFormatted,
  };
}

/**
 * Computes the new scheme expiry date after purchasing `newGheeKg` kg of Desi Ghee.
 * Rule:
 * 1 kg = 30 days (1 month)
 * 2 kg = 60 days (2 months)
 * e.g. newDays = Math.round(newGheeKg * 30) (minimum 30 days for any ghee purchase >= 0.5kg)
 */
export function calculateNewLoyaltyExpiry(
  newGheeKg: number,
  fromDate: Date = new Date(),
  currentExpiry?: string
): string {
  if (newGheeKg <= 0) {
    return currentExpiry || '';
  }

  // Calculate days based on ghee kg: 1 kg = 30 days
  const validDays = Math.max(15, Math.round(newGheeKg * 30));
  
  const baseDate = new Date(fromDate);
  const newExpiry = new Date(baseDate.getTime() + validDays * 24 * 60 * 60 * 1000);

  // If customer already has an active future expiry that is later, keep the later one
  if (currentExpiry) {
    const existingExpiry = new Date(currentExpiry);
    if (existingExpiry > newExpiry) {
      return existingExpiry.toISOString();
    }
  }

  return newExpiry.toISOString();
}
