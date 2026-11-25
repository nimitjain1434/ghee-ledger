import {
  AppData,
  BusinessSettings,
  CashDrawerEntry,
  Customer,
  DenominationCount,
  KhataPayment,
  ProductItem,
  PurchaseExpense,
  Sale,
} from '../types';
import { generateThreeYearHistoricalData } from './historicalData';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  LEGACY_FULL_PAID_BILL_TEMPLATE,
  LEGACY_PENDING_BILL_TEMPLATE,
  LEGACY_V2_BILL_TEMPLATE,
} from './formatters';

const STORAGE_KEYS = {
  SETTINGS: 'ghee_app_settings',
  PRODUCTS: 'ghee_app_products',
  CUSTOMERS: 'ghee_app_customers',
  SALES: 'ghee_app_sales',
  KHATA_PAYMENTS: 'ghee_app_khata_payments',
  PURCHASES_EXPENSES: 'ghee_app_purchases_expenses',
  CASH_DRAWER: 'ghee_app_cash_drawer',
  DENOMINATIONS: 'ghee_app_denominations',
  SEED_VERSION: 'ghee_app_seed_version',
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  shopName: 'Shri Krishna Desi Ghee Bhandar',
  ownerName: 'Papaji (Shop Owner)',
  phone: '9876543210',
  address: 'Main Market, Shop No. 12',
  gheeSchemeDiscountPercent: 5,
  schemeMonthsPerKg: 1, // 1 kg = 1 month (30 days)
  loyaltySchemeEnabled: true,
  whatsAppTemplates: {
    ...DEFAULT_WHATSAPP_TEMPLATES,
  },
};

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_1',
    name: 'Pure Desi Cow Ghee',
    nameHindi: 'शुद्ध गाय का देसी घी',
    type: 'desi_ghee',
    defaultRatePerKg: 680,
    unit: 'kg',
    isGhee: true,
  },
  {
    id: 'prod_2',
    name: 'Bilona Buffalo Desi Ghee',
    nameHindi: 'शुद्ध भैंस का देसी घी (बिलौना)',
    type: 'desi_ghee',
    defaultRatePerKg: 740,
    unit: 'kg',
    isGhee: true,
  },
  {
    id: 'prod_3',
    name: 'Fresh Dairy Butter (Makhan)',
    nameHindi: 'ताज़ा डेयरी मक्खन',
    type: 'butter',
    defaultRatePerKg: 520,
    unit: 'kg',
    isGhee: false,
  },
  {
    id: 'prod_4',
    name: 'Fresh Dairy Cream (Malai)',
    nameHindi: 'ताज़ा मलाई / क्रीम',
    type: 'cream',
    defaultRatePerKg: 335,
    unit: 'kg',
    isGhee: false,
    testPercentage: 51,
    baseRatePerKg: 335,
  },
  {
    id: 'prod_5',
    name: 'Wholesale Repack Ghee',
    nameHindi: 'थोक देसी घी (रीपैक)',
    type: 'wholesale_ghee',
    defaultRatePerKg: 620,
    unit: 'kg',
    isGhee: true,
  },
];

const now = new Date();
const todayISO = now.toISOString().split('T')[0];

// Helper date offsets
const daysAgo = (days: number) => {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};
const daysFromNow = (days: number) => {
  const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Ramesh Sharma',
    phone: '9820011223',
    address: 'Sector 4, Near Temple',
    createdAt: daysAgo(40),
    totalPurchases: 4500,
    totalGheeBoughtKg: 3,
    pendingBalance: 500, // ₹500 pending
    lastGheePurchaseDate: daysAgo(10),
    lastGheePurchaseKg: 1, // Bought 1 kg 10 days ago => 30 - 10 = 20 days left!
    loyaltyExpiresAt: daysFromNow(20),
  },
  {
    id: 'cust_2',
    name: 'Mukesh Verma (Halwai)',
    phone: '9871122334',
    address: 'Sweet Shop, Chowk',
    createdAt: daysAgo(60),
    totalPurchases: 18500,
    totalGheeBoughtKg: 15,
    pendingBalance: 2400, // ₹2400 pending
    lastGheePurchaseDate: daysAgo(18),
    lastGheePurchaseKg: 5, // Bought 5 kg 18 days ago => 150 - 18 = 132 days left!
    loyaltyExpiresAt: daysFromNow(132),
  },
  {
    id: 'cust_3',
    name: 'Pooja Gupta',
    phone: '9819988776',
    address: 'Flat 302, Royal Residency',
    createdAt: daysAgo(75),
    totalPurchases: 2720,
    totalGheeBoughtKg: 4,
    pendingBalance: 0,
    lastGheePurchaseDate: daysAgo(12),
    lastGheePurchaseKg: 2, // Bought 2 kg 12 days ago => 60 - 12 = 48 days left!
    loyaltyExpiresAt: daysFromNow(48),
  },
  {
    id: 'cust_4',
    name: 'Sunil Choudhary',
    phone: '9845566778',
    address: 'Civil Lines',
    createdAt: daysAgo(50),
    totalPurchases: 1360,
    totalGheeBoughtKg: 2,
    pendingBalance: 0,
    lastGheePurchaseDate: daysAgo(45),
    lastGheePurchaseKg: 1, // Scheme expired 15 days ago!
    loyaltyExpiresAt: daysAgo(15),
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_1',
    invoiceNo: 'INV-1001',
    customerId: 'cust_1',
    customerName: 'Ramesh Sharma',
    customerPhone: '9820011223',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString(),
    items: [
      {
        productId: 'prod_1',
        productName: 'Pure Desi Cow Ghee',
        quantityKg: 1,
        ratePerKg: 680,
        total: 680,
        isGhee: true,
      },
    ],
    subtotal: 680,
    discountPercent: 5,
    discountAmount: 34,
    totalAmount: 646,
    paymentMode: 'split',
    cashReceived: 400,
    onlineReceived: 0,
    pendingAmount: 246, // Partial pending
    isLoyaltyDiscountApplied: true,
    loyaltySchemeActivatedKg: 1,
    notes: 'Repeat buyer, 5% discount applied',
  },
  {
    id: 'sale_2',
    invoiceNo: 'INV-1002',
    customerId: 'cust_3',
    customerName: 'Pooja Gupta',
    customerPhone: '9819988776',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 15).toISOString(),
    items: [
      {
        productId: 'prod_2',
        productName: 'Bilona Buffalo Desi Ghee',
        quantityKg: 2,
        ratePerKg: 740,
        total: 1480,
        isGhee: true,
      },
    ],
    subtotal: 1480,
    discountPercent: 5,
    discountAmount: 74,
    totalAmount: 1406,
    paymentMode: 'online',
    cashReceived: 0,
    onlineReceived: 1406,
    pendingAmount: 0,
    isLoyaltyDiscountApplied: true,
    loyaltySchemeActivatedKg: 2,
    notes: 'Paid via GPay',
  },
  {
    id: 'sale_3',
    invoiceNo: 'INV-1003',
    customerId: 'cust_new',
    customerName: 'Anil Agarwal',
    customerPhone: '9833445566',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 40).toISOString(),
    items: [
      {
        productId: 'prod_1',
        productName: 'Pure Desi Cow Ghee',
        quantityKg: 1,
        ratePerKg: 680,
        total: 680,
        isGhee: true,
      },
    ],
    subtotal: 680,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 680,
    paymentMode: 'cash',
    cashReceived: 680,
    onlineReceived: 0,
    pendingAmount: 0,
    isLoyaltyDiscountApplied: false,
    loyaltySchemeActivatedKg: 1,
    notes: 'First purchase, scheme started for 1 month',
  },
];

export const INITIAL_PURCHASES_EXPENSES: PurchaseExpense[] = [
  {
    id: 'pur_1',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).toISOString(),
    category: 'raw_cream',
    title: 'Raw Dairy Cream (कच्ची मलाई / क्रीम)',
    supplierOrPayee: 'Babulal Dairy Village',
    quantityKg: 20,
    ratePerKg: 300,
    totalAmount: 6000,
    paymentMode: 'cash',
    notes: 'Morning fresh cream for boiling into ghee',
  },
  {
    id: 'pur_2',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
    category: 'shop_expense',
    title: 'Glass Jars & Tin Packaging',
    supplierOrPayee: 'Shree Plastics & Containers',
    totalAmount: 450,
    paymentMode: 'cash',
    notes: '1 kg and 2 kg empty containers',
  },
  {
    id: 'pur_3',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
    category: 'wholesale_ghee',
    title: 'Wholesale Desi Ghee Tin (15kg)',
    supplierOrPayee: 'Aggarwal Wholesale Mandi',
    quantityKg: 15,
    ratePerKg: 580,
    totalAmount: 8700,
    paymentMode: 'online',
    notes: 'Paid via Bank NEFT',
  },
];

export const INITIAL_CASH_DRAWER: CashDrawerEntry = {
  id: `drawer_${todayISO}`,
  date: todayISO,
  openingCash: 10000, // Father started morning with ₹10,000 cash in drawer
  addedCash: 0,
  withdrawnCash: 0,
  notes: 'Morning opening drawer cash',
};

export const INITIAL_DENOMINATIONS: DenominationCount = {
  500: 0,
  200: 0,
  100: 0,
  50: 0,
  20: 0,
  10: 0,
  coins: 0,
};

// Storage helper functions
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

// Full app state getter & setter
export function loadAllData(): AppData {
  const rawSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const rawTemplates = rawSettings.whatsAppTemplates || {};
  const trimmedFullPaid = rawTemplates.fullPaidBillTemplate?.trim();
  const migratedFullPaid =
    !trimmedFullPaid ||
    trimmedFullPaid === LEGACY_FULL_PAID_BILL_TEMPLATE.trim() ||
    trimmedFullPaid === LEGACY_V2_BILL_TEMPLATE.trim()
      ? DEFAULT_WHATSAPP_TEMPLATES.fullPaidBillTemplate
      : rawTemplates.fullPaidBillTemplate;
  const trimmedPending = rawTemplates.pendingBillTemplate?.trim();
  const migratedPending =
    !trimmedPending ||
    trimmedPending === LEGACY_PENDING_BILL_TEMPLATE.trim() ||
    trimmedPending === LEGACY_V2_BILL_TEMPLATE.trim()
      ? DEFAULT_WHATSAPP_TEMPLATES.pendingBillTemplate
      : rawTemplates.pendingBillTemplate;

  const settings: BusinessSettings = {
    ...DEFAULT_SETTINGS,
    ...rawSettings,
    loyaltySchemeEnabled: rawSettings.loyaltySchemeEnabled !== false,
    whatsAppTemplates: {
      ...DEFAULT_WHATSAPP_TEMPLATES,
      ...rawTemplates,
      fullPaidBillTemplate: migratedFullPaid,
      pendingBillTemplate: migratedPending,
    },
  };

  const seedVersion = localStorage.getItem(STORAGE_KEYS.SEED_VERSION);
  let savedSales = loadFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  let savedPurchases = loadFromStorage<PurchaseExpense[]>(STORAGE_KEYS.PURCHASES_EXPENSES, []);
  let savedKhata = loadFromStorage<KhataPayment[]>(STORAGE_KEYS.KHATA_PAYMENTS, []);
  let savedDrawer = loadFromStorage<Record<string, CashDrawerEntry>>(STORAGE_KEYS.CASH_DRAWER, {});
  let savedDenoms = loadFromStorage<Record<string, DenominationCount>>(STORAGE_KEYS.DENOMINATIONS, {});
  let savedCustomers = loadFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);

  // If seed not set yet and no records exist, seed initial sample data on very first run
  if (!seedVersion && savedSales.length === 0) {
    const historical = generateThreeYearHistoricalData();

    // Merge any user-created sales that aren't seed
    const userCreatedSales = savedSales.filter((s) => !s.id.startsWith('sale_seed_'));
    savedSales = [...historical.sales, ...userCreatedSales];

    const userCreatedPurchases = savedPurchases.filter((p) => !p.id.startsWith('pur_seed_'));
    savedPurchases = [...historical.purchasesExpenses, ...userCreatedPurchases];

    const userCreatedKhata = savedKhata.filter((k) => !k.id.startsWith('khata_seed_'));
    savedKhata = [...historical.khataPayments, ...userCreatedKhata];

    savedDrawer = {
      ...historical.cashDrawer,
      ...savedDrawer,
    };

    savedDenoms = {
      ...historical.denominations,
      ...savedDenoms,
    };

    // Merge customers
    if (savedCustomers.length === 0 || savedCustomers.length <= INITIAL_CUSTOMERS.length) {
      savedCustomers = historical.customers;
    }

    localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'fy_3yr_v1');
    saveToStorage(STORAGE_KEYS.SALES, savedSales);
    saveToStorage(STORAGE_KEYS.PURCHASES_EXPENSES, savedPurchases);
    saveToStorage(STORAGE_KEYS.KHATA_PAYMENTS, savedKhata);
    saveToStorage(STORAGE_KEYS.CASH_DRAWER, savedDrawer);
    saveToStorage(STORAGE_KEYS.DENOMINATIONS, savedDenoms);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, savedCustomers);
  }

  return {
    settings,
    products: loadFromStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS),
    customers: savedCustomers,
    sales: savedSales,
    khataPayments: savedKhata,
    purchasesExpenses: savedPurchases,
    cashDrawer: savedDrawer,
    denominations: savedDenoms,
  };
}

export function saveAllData(data: AppData): void {
  saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
  saveToStorage(STORAGE_KEYS.PRODUCTS, data.products);
  saveToStorage(STORAGE_KEYS.CUSTOMERS, data.customers);
  saveToStorage(STORAGE_KEYS.SALES, data.sales);
  saveToStorage(STORAGE_KEYS.KHATA_PAYMENTS, data.khataPayments);
  saveToStorage(STORAGE_KEYS.PURCHASES_EXPENSES, data.purchasesExpenses);
  saveToStorage(STORAGE_KEYS.CASH_DRAWER, data.cashDrawer);
  saveToStorage(STORAGE_KEYS.DENOMINATIONS, data.denominations);
}

export function exportBackupJSON(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Desi_Ghee_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetToSampleData(): AppData {
  const historical = generateThreeYearHistoricalData();
  const data: AppData = {
    settings: DEFAULT_SETTINGS,
    products: DEFAULT_PRODUCTS,
    customers: historical.customers,
    sales: historical.sales,
    khataPayments: historical.khataPayments,
    purchasesExpenses: historical.purchasesExpenses,
    cashDrawer: historical.cashDrawer,
    denominations: historical.denominations,
  };
  localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'fy_3yr_v1');
  saveAllData(data);
  return data;
}

export function clearAllData(): AppData {
  return resetToZeroData();
}

export function resetToZeroData(currentSettings?: BusinessSettings, currentProducts?: ProductItem[]): AppData {
  const data: AppData = {
    settings: currentSettings || DEFAULT_SETTINGS,
    products: currentProducts || DEFAULT_PRODUCTS,
    customers: [],
    sales: [],
    khataPayments: [],
    purchasesExpenses: [],
    cashDrawer: {
      [todayISO]: {
        id: `drawer_${todayISO}`,
        date: todayISO,
        openingCash: 0,
        addedCash: 0,
        withdrawnCash: 0,
      },
    },
    denominations: { [todayISO]: INITIAL_DENOMINATIONS },
  };
  localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'fresh_zero');
  saveAllData(data);
  return data;
}
