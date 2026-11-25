import { ProductItem, SaleItem, PurchaseExpense } from '../types';

/**
 * Cream Fat Testing & Ghee Yield Calculator
 *
 * Dairy trade rules as specified:
 * 1. Fat content of raw cream is measured via testing method (e.g. 51%, 52%, 53%, 55%, etc.).
 * 2. 1% is boiling / curdling / processing loss.
 *    - For test rating T%, the net Ghee yield is (T - 1)%.
 *    - Example: 51% test -> 50% ghee yield (100g cream gives 50g ghee).
 *    - Example: 53% test -> 52% ghee yield (100g cream gives 52g ghee).
 *    - Example: 55% test -> 54% ghee yield (100g cream gives 54g ghee).
 *
 * 3. Base benchmark: 51 Test Cream Rate (R51, in ₹/kg).
 *    - Since 1 kg of 51-test cream yields 0.50 kg (50%) ghee and costs R51:
 *      50g of ghee costs (R51 / 10), or 500g costs R51.
 *      1 kg pure ghee equivalent is R51 / 0.50 = 2 * R51.
 *
 * 4. Unitary Method for cream of test T%:
 *    - Per 100g cream, ghee yield = (T - 1) grams.
 *    - Price per 100g cream = (R51 / 50) * (T - 1).
 *    - Price per 1 kg cream = R51 * (T - 1) / 50.
 *
 * 5. Total Amount for Weight W (in kg):
 *    - Total Amount = W * [R51 * (T - 1) / 50].
 *
 * 6. Total Ghee Produced (in kg):
 *    - Expected Ghee (kg) = W * (T - 1) / 100.
 */

export interface CreamCalculationResult {
  testPercent: number; // T (e.g. 54%)
  lossPercent: number; // 1%
  gheeYieldPercent: number; // T - 1 (e.g. 53%)
  base51Rate: number; // R51 (e.g. 300 ₹/kg)
  effectiveRatePerKg: number; // R51 * (T - 1) / 50 (e.g. 318 ₹/kg)
  weightKg: number; // W (e.g. 20 kg)
  totalAmount: number; // W * effectiveRatePerKg (e.g. 6360 ₹)
  expectedGheeKg: number; // W * (T - 1) / 100 (e.g. 10.6 kg)
  equivalentPureGheeRate: number; // 2 * R51 (e.g. 600 ₹/kg)
}

/**
 * Calculate cream rate, total price, and expected ghee yield based on 51-test base rate.
 */
export function calculateCreamPrice(
  testPercent: number,
  base51Rate: number,
  weightKg: number
): CreamCalculationResult {
  const safeTest = Math.max(1, Number(testPercent) || 51);
  const safeBaseRate = Math.max(0, Number(base51Rate) || 0);
  const safeWeight = Math.max(0, Number(weightKg) || 0);

  const lossPercent = 1;
  const gheeYieldPercent = Math.max(0, safeTest - lossPercent);

  // Unitary method: 50% ghee cost is base51Rate, so 1% ghee cost is base51Rate / 50
  const effectiveRatePerKg = safeBaseRate > 0 ? (safeBaseRate * gheeYieldPercent) / 50 : 0;
  const totalAmount = Math.round(safeWeight * effectiveRatePerKg);
  const expectedGheeKg = Math.round(((safeWeight * gheeYieldPercent) / 100) * 1000) / 1000;
  const equivalentPureGheeRate = Math.round(safeBaseRate * 2);

  return {
    testPercent: safeTest,
    lossPercent,
    gheeYieldPercent,
    base51Rate: safeBaseRate,
    effectiveRatePerKg: Math.round(effectiveRatePerKg * 100) / 100,
    weightKg: safeWeight,
    totalAmount,
    expectedGheeKg,
    equivalentPureGheeRate,
  };
}

/**
 * Calculate weight (kg) from total amount, test rating, and 51-rate
 */
export function calculateWeightFromAmount(
  totalAmount: number,
  testPercent: number,
  base51Rate: number
): number {
  const res = calculateCreamPrice(testPercent, base51Rate, 1);
  if (res.effectiveRatePerKg <= 0) return 0;
  return Math.round((totalAmount / res.effectiveRatePerKg) * 1000) / 1000;
}

/**
 * Check if a product item or purchase is a Cream item (raw cream / malai)
 */
export function isCreamProduct(
  item: {
    type?: string;
    productName?: string;
    name?: string;
    title?: string;
    isFatTestBased?: boolean;
    productId?: string;
  },
  catalogProducts?: ProductItem[]
): boolean {
  if (item.isFatTestBased) return true;
  if (item.type === 'cream') return true;

  const combined = `${item.title || ''} ${item.productName || ''} ${item.name || ''}`.toLowerCase();
  if (
    combined.includes('cream') ||
    combined.includes('मलाई') ||
    combined.includes('malai') ||
    combined.includes('raw cream')
  ) {
    return true;
  }

  if (item.productId && catalogProducts) {
    const p = catalogProducts.find((cp) => cp.id === item.productId);
    if (p && (p.type === 'cream' || p.isFatTestBased)) return true;
  }

  return false;
}

/**
 * Format a concise summary badge string for a fat-tested cream entry
 */
export function formatFatTestSummary(
  fatTest?: number,
  base51Rate?: number,
  ratePerKg?: number,
  expectedGheeKg?: number
): string {
  if (!fatTest) return '';
  const gheeYield = Math.max(0, fatTest - 1);
  const parts: string[] = [`${fatTest}% Test (${gheeYield}% Ghee)`];
  if (base51Rate) {
    parts.push(`51-भाव: ₹${base51Rate}`);
  }
  if (ratePerKg) {
    parts.push(`दर: ₹${ratePerKg}/kg`);
  }
  if (expectedGheeKg) {
    parts.push(`घी: ${expectedGheeKg.toFixed(3)}kg`);
  }
  return parts.join(' • ');
}
