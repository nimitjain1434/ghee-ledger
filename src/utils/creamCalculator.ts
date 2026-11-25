/**
 * Cream Pricing Engine based on Realized Ghee-Yield Model
 *
 * Mandi / Dairy Principle:
 * - Base Rate is pegged strictly to 51% test cream.
 * - 1 kg of 51% test cream yields 500 grams (0.5 kg) of finished pure ghee (a 1.0% processing loss).
 * - Implicit value of pure ghee = Base Rate / 0.5 kg = Base Rate * 2.
 * - Realized ghee yield for test T% = (T - 1.0)%, i.e. (T - 1.0) * 10 grams per kg of cream.
 * - Per-kg Rate = (Realized Ghee in kg) * (Price of 1 kg Pure Ghee)
 *               = ((T - 1.0) / 100) * (Base Rate * 2)
 *               = Base Rate * ((T - 1.0) / 50)
 *
 * Examples:
 * - Test 51.0%, Base ₹335 -> 500g ghee -> ₹335.00/kg
 * - Test 55.0%, Base ₹335 -> 540g ghee -> ₹361.80/kg
 * - Test 58.5%, Base ₹335 -> 575g ghee -> ₹385.25/kg
 */

export interface CreamCalculationResult {
  testPercentage: number;
  baseRate: number;
  gheeYieldPercent: number;
  gheeYieldGramsPerKg: number;
  gheeYieldKgPerKg: number;
  impliedGheeRatePerKg: number;
  finalRatePerKg: number;
  quantityKg: number;
  totalAmount: number;
}

/**
 * Calculates cream rate and metrics from Test % and Base Rate (51% test)
 */
export function calculateCreamRateFromGheeYield(
  testPercentage: number,
  baseRate: number,
  quantityKg: number = 1
): CreamCalculationResult {
  const safeTest = Math.max(1.1, Number(testPercentage) || 51);
  const safeBaseRate = Math.max(0, Number(baseRate) || 0);
  const safeQty = Math.max(0, Number(quantityKg) || 0);

  // Ghee Yield % is test point minus 1.0%
  const gheeYieldPercent = Math.max(0, safeTest - 1.0);
  const gheeYieldKgPerKg = gheeYieldPercent / 100;
  const gheeYieldGramsPerKg = gheeYieldPercent * 10;

  // Implied price of pure ghee (Base rate of 51 test / 0.5 kg)
  const impliedGheeRatePerKg = safeBaseRate * 2;

  // Final rate per kg of this test % cream: BaseRate * ( (Test - 1) / 50 )
  // Round rate to 2 decimal places (standard commercial paisa precision)
  const rawFinalRate = safeBaseRate * (gheeYieldPercent / 50);
  const finalRatePerKg = Math.round(rawFinalRate * 100) / 100;

  // Total amount = Quantity * FinalRate (rounded to whole rupee)
  const rawTotal = safeQty * finalRatePerKg;
  const totalAmount = Math.round(rawTotal);

  return {
    testPercentage: safeTest,
    baseRate: safeBaseRate,
    gheeYieldPercent: Math.round(gheeYieldPercent * 100) / 100,
    gheeYieldGramsPerKg: Math.round(gheeYieldGramsPerKg * 10) / 10,
    gheeYieldKgPerKg: Math.round(gheeYieldKgPerKg * 1000) / 1000,
    impliedGheeRatePerKg: Math.round(impliedGheeRatePerKg * 100) / 100,
    finalRatePerKg,
    quantityKg: safeQty,
    totalAmount,
  };
}

/**
 * Reverse calculate: Adjust Base Rate (51% test) when a custom Final Rate is entered
 * BaseRate = (FinalRate * 50) / (Test% - 1.0)
 */
export function calculateCreamBaseRateFromFinal(
  testPercentage: number,
  finalRatePerKg: number
): number {
  const safeTest = Math.max(1.1, Number(testPercentage) || 51);
  const safeFinalRate = Math.max(0, Number(finalRatePerKg) || 0);
  const yieldDivisor = (safeTest - 1.0) / 50;

  if (yieldDivisor <= 0) return 0;

  const baseRate = safeFinalRate / yieldDivisor;
  return Math.round(baseRate * 100) / 100;
}

/**
 * Check if a product or line item represents Cream
 */
export function isCreamProduct(
  item: { type?: string; name?: string; productName?: string } | null | undefined
): boolean {
  if (!item) return false;
  if (item.type === 'cream') return true;
  const name = (item.name || item.productName || '').toLowerCase();
  return (
    name.includes('cream') ||
    name.includes('मलाई') ||
    name.includes('malai')
  );
}
