export type PaymentMode = 'cash' | 'online' | 'split';

export type ProductType = 'desi_ghee' | 'cream' | 'butter' | 'wholesale_ghee' | 'other';

export interface ProductItem {
  id: string;
  name: string;
  nameHindi: string;
  type: ProductType;
  defaultRatePerKg: number; // in Rupees per kg
  unit: 'kg' | 'pack' | 'tin';
  isGhee: boolean; // Is this physical item Ghee (Desi Ghee or Wholesale Ghee)
  schemeEligible?: boolean; // Qualifies for the customer loyalty scheme discount when scheme is active
  testPercentage?: number; // For cream SKU: standard test percentage (e.g. 51%)
  baseRatePerKg?: number; // For cream SKU: base rate for 51% test cream
  isFatTestBased?: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantityKg: number;
  ratePerKg: number;
  total: number;
  isGhee: boolean;
  schemeEligible?: boolean;
  isCream?: boolean;
  isFatTestBased?: boolean;
  testPercentage?: number;
  fatTest?: number;
  baseRate?: number;
  base51Rate?: number;
  gheeYieldPercent?: number;
  gheeYieldKg?: number;
  expectedGheeKg?: number;
  adjustTarget?: 'qty' | 'rate';
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string; // ISO date string YYYY-MM-DDTHH:mm:ss
  items: SaleItem[];
  subtotal: number;
  discountPercent: number; // e.g. 5 if loyalty discount applied
  discountAmount: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  cashReceived: number;
  onlineReceived: number;
  pendingAmount: number; // Current bill unpaid amount (Udhaar)
  previousUdhaar?: number; // Previous pending Udhaar included/mentioned on this bill
  previousUdhaarCleared?: number; // Portion of previousUdhaar cleared by this bill's payment/advance
  advanceUsed?: number; // Previously deposited extra money deducted from this bill
  extraPaymentAdded?: number; // Extra money paid on this bill saved to customer advance
  isLoyaltyDiscountApplied: boolean;
  loyaltySchemeActivatedKg?: number; // Total ghee kg in this sale that extends loyalty
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  totalPurchases: number;
  totalGheeBoughtKg: number;
  pendingBalance: number; // Udhaar (Customer owes shop)
  advanceBalance?: number; // Extra money / Advance Jama (Shop holds for customer's future bills)
  // Loyalty scheme tracker
  lastGheePurchaseDate?: string;
  lastGheePurchaseKg?: number;
  loyaltyExpiresAt?: string; // Valid until this date
}

export interface KhataPayment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  amount: number;
  paymentMode: 'cash' | 'online';
  type?: 'udhaar_repayment' | 'advance_deposit';
  udhaarCleared?: number;
  advanceAdded?: number;
  note?: string;
}

export type PurchaseCategory = 'raw_cream' | 'wholesale_ghee' | 'shop_expense';

export interface PurchaseExpense {
  id: string;
  date: string;
  category: PurchaseCategory;
  title: string;
  supplierOrPayee: string;
  quantityKg?: number;
  ratePerKg?: number;
  totalAmount: number;
  paymentMode: 'cash' | 'online';
  notes?: string;
  isCreamPurchase?: boolean;
  isFatTestBased?: boolean;
  testPercentage?: number;
  fatTest?: number;
  baseRate?: number;
  base51Rate?: number;
  gheeYieldPercent?: number;
  gheeYieldKg?: number;
  expectedGheeKg?: number;
}

export interface CashMovement {
  id: string;
  time: string; // HH:mm or ISO
  amount: number;
  reason: string;
  type: 'add' | 'withdraw';
  channel?: 'cash' | 'bank';
}

export interface CashDrawerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number;
  addedCash: number;
  withdrawnCash: number; // e.g. cash taken home or deposited to bank
  notes?: string;
  withdrawalsList?: CashMovement[];
  additionsList?: CashMovement[];
  // Online / Bank Account Additions & Withdrawals
  openingBank?: number;
  addedBank?: number; // e.g. money deposited or transferred into bank account
  withdrawnBank?: number; // e.g. money withdrawn from bank account (ATM/personal transfer)
  bankWithdrawalsList?: CashMovement[];
  bankAdditionsList?: CashMovement[];
}

export type FinancialYear = '2024-25' | '2025-26' | '2026-27';

export interface DenominationCount {
  500: number;
  200: number;
  100: number;
  50: number;
  20: number;
  10: number;
  coins: number;
}

export interface WhatsAppTemplates {
  fullPaidBillTemplate: string;
  pendingBillTemplate: string;
  paymentConfirmationTemplate: string;
}

export interface BusinessSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  gheeSchemeDiscountPercent: number; // default 5%
  schemeMonthsPerKg: number; // default 1 month per 1 kg
  loyaltySchemeEnabled: boolean; // toggle loyalty scheme on/off
  whatsAppTemplates?: Partial<WhatsAppTemplates>;
}

export interface AppData {
  settings: BusinessSettings;
  products: ProductItem[];
  customers: Customer[];
  sales: Sale[];
  khataPayments: KhataPayment[];
  purchasesExpenses: PurchaseExpense[];
  cashDrawer: Record<string, CashDrawerEntry>;
  denominations: Record<string, DenominationCount>;
}

