import { ProductItem, Sale, SaleItem } from '../types';

/**
 * Robust helper to determine whether an item or product is Ghee (Desi Ghee, Wholesale Ghee, Cow Ghee, Buffalo Ghee, etc.).
 * This classification is purely based on the physical dairy product type and name,
 * and is INDEPENDENT of whether any customer loyalty discount scheme is enabled or disabled.
 */
export function isGheeProduct(
  item: {
    productName?: string;
    name?: string;
    nameHindi?: string;
    type?: string;
    productId?: string;
    isGhee?: boolean;
  },
  catalogProducts?: ProductItem[]
): boolean {
  // If explicitly flagged as ghee
  if (item.isGhee) return true;

  // If product type is desi_ghee or wholesale_ghee
  if (item.type === 'desi_ghee' || item.type === 'wholesale_ghee') return true;

  // Check product name or hindi name for "ghee" or "घी"
  const combinedName = `${item.productName || ''} ${item.name || ''} ${item.nameHindi || ''}`.toLowerCase();
  if (combinedName.includes('ghee') || combinedName.includes('घी')) {
    return true;
  }

  // Lookup in products catalog if productId is provided
  if (item.productId && catalogProducts && catalogProducts.length > 0) {
    const matched = catalogProducts.find((p) => p.id === item.productId);
    if (matched) {
      if (matched.isGhee) return true;
      if (matched.type === 'desi_ghee' || matched.type === 'wholesale_ghee') return true;
      const matchedName = `${matched.name || ''} ${matched.nameHindi || ''}`.toLowerCase();
      if (matchedName.includes('ghee') || matchedName.includes('घी')) return true;
    }
  }

  return false;
}

/**
 * Robust helper to calculate total kg of Ghee sold in a single Sale.
 */
export function getGheeSoldFromSale(sale: Sale, catalogProducts?: ProductItem[]): number {
  if (!sale.items || sale.items.length === 0) return 0;
  return sale.items
    .filter((it) => isGheeProduct(it, catalogProducts))
    .reduce((sum, it) => sum + (it.quantityKg || 0), 0);
}

/**
 * Robust helper to calculate total kg of Ghee sold across an array of Sales.
 */
export function getGheeSoldFromSales(sales: Sale[], catalogProducts?: ProductItem[]): number {
  return sales.reduce((total, sale) => total + getGheeSoldFromSale(sale, catalogProducts), 0);
}

/**
 * Check whether an item qualifies for the customer loyalty scheme discount.
 * Requires:
 * 1. The shop-level loyaltySchemeEnabled setting is ON (not false)
 * 2. The item is actually a Ghee product
 * 3. The item has not explicitly opted out via schemeEligible === false
 */
export function isItemSchemeEligible(
  item: {
    productName?: string;
    name?: string;
    nameHindi?: string;
    type?: string;
    productId?: string;
    isGhee?: boolean;
    schemeEligible?: boolean;
  },
  loyaltySchemeEnabled: boolean = true,
  catalogProducts?: ProductItem[]
): boolean {
  if (!loyaltySchemeEnabled) return false;
  if (!isGheeProduct(item, catalogProducts)) return false;
  if (item.schemeEligible === false) return false;
  return true;
}
