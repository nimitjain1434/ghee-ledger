import {
  CashDrawerEntry,
  Customer,
  DenominationCount,
  KhataPayment,
  PurchaseExpense,
  Sale,
} from '../types';

// Deterministic random helper so seed is consistent across refreshes
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateThreeYearHistoricalData(): {
  sales: Sale[];
  khataPayments: KhataPayment[];
  purchasesExpenses: PurchaseExpense[];
  cashDrawer: Record<string, CashDrawerEntry>;
  denominations: Record<string, DenominationCount>;
  customers: Customer[];
} {
  const customers: Customer[] = [
    {
      id: 'cust_1',
      name: 'Ramesh Sharma',
      phone: '9820011223',
      address: 'Sector 4, Near Mandir',
      createdAt: '2024-04-10T10:00:00.000Z',
      totalPurchases: 28400,
      totalGheeBoughtKg: 38.5,
      pendingBalance: 500,
      lastGheePurchaseDate: '2026-09-08T11:30:00.000Z',
      lastGheePurchaseKg: 2.0,
      loyaltyExpiresAt: '2026-11-08T00:00:00.000Z',
    },
    {
      id: 'cust_2',
      name: 'Mukesh Verma (Halwai)',
      phone: '9871122334',
      address: 'Chowk Sweet House, Main Bazar',
      createdAt: '2024-04-15T09:00:00.000Z',
      totalPurchases: 342000,
      totalGheeBoughtKg: 520.0,
      pendingBalance: 2400,
      lastGheePurchaseDate: '2026-09-10T14:00:00.000Z',
      lastGheePurchaseKg: 15.0,
      loyaltyExpiresAt: '2027-12-10T00:00:00.000Z',
    },
    {
      id: 'cust_3',
      name: 'Pooja Gupta',
      phone: '9819988776',
      address: 'Flat 302, Royal Enclave',
      createdAt: '2024-05-02T16:00:00.000Z',
      totalPurchases: 22600,
      totalGheeBoughtKg: 31.0,
      pendingBalance: 0,
      lastGheePurchaseDate: '2026-09-02T12:15:00.000Z',
      lastGheePurchaseKg: 1.5,
      loyaltyExpiresAt: '2026-10-17T00:00:00.000Z',
    },
    {
      id: 'cust_4',
      name: 'Sunil Choudhary',
      phone: '9845566778',
      address: 'Civil Lines, Gali 3',
      createdAt: '2024-06-18T18:00:00.000Z',
      totalPurchases: 18400,
      totalGheeBoughtKg: 25.0,
      pendingBalance: 0,
      lastGheePurchaseDate: '2026-08-20T10:00:00.000Z',
      lastGheePurchaseKg: 2.0,
      loyaltyExpiresAt: '2026-10-20T00:00:00.000Z',
    },
    {
      id: 'cust_5',
      name: 'Dinesh Sweets & Catering',
      phone: '9810055443',
      address: 'Railway Road, Opp Station',
      createdAt: '2024-07-01T08:30:00.000Z',
      totalPurchases: 215000,
      totalGheeBoughtKg: 310.0,
      pendingBalance: 4500,
      lastGheePurchaseDate: '2026-09-11T16:45:00.000Z',
      lastGheePurchaseKg: 10.0,
      loyaltyExpiresAt: '2027-07-11T00:00:00.000Z',
    },
    {
      id: 'cust_6',
      name: 'Smt. Sharda Devi',
      phone: '9899112233',
      address: 'Old City, Haveli Gali',
      createdAt: '2024-08-12T11:00:00.000Z',
      totalPurchases: 14200,
      totalGheeBoughtKg: 19.0,
      pendingBalance: 0,
      lastGheePurchaseDate: '2026-09-05T09:30:00.000Z',
      lastGheePurchaseKg: 1.0,
      loyaltyExpiresAt: '2026-10-05T00:00:00.000Z',
    },
  ];

  const sales: Sale[] = [];
  const khataPayments: KhataPayment[] = [];
  const purchasesExpenses: PurchaseExpense[] = [];
  const cashDrawer: Record<string, CashDrawerEntry> = {};
  const denominations: Record<string, DenominationCount> = {};

  let invCounter = 1001;
  let saleIdCounter = 1;
  let khataIdCounter = 1;
  let purIdCounter = 1;
  let randSeed = 42;

  const withdrawalReasons = [
    'Papaji cash withdrawal for household expense (पापाजी ने घर खर्च हेतु निकाले)',
    'Deposited cash into PNB Current Bank Account (पीएनबी बैंक खाते में जमा)',
    'Payment to Dairy Farm Milk/Cream Supplier (दूधिया / मलाई वाले को भुगतान)',
    'Cash withdrawal for daughter college fees (बिटिया की कॉलेज फीस हेतु)',
    'Purchased Ghee Jars & Packaging materials in cash (डिब्बे व पैकिंग सामग्री)',
    'Monthly helper Ramu wages & tea allowance (दुकान हेल्पर रामू का वेतन)',
    'Shop electricity meter bill cash payment (दुकान बिजली बिल भुगतान)',
    'Personal withdrawal by owner for medicine & groceries (घरेलू दवा व किराना)',
  ];

  // Helper to record a sale
  const addSale = (
    dateStr: string,
    timeStr: string,
    custIndex: number,
    gheeType: 'cow' | 'buffalo' | 'mix',
    weightKg: number,
    mode: 'cash' | 'online' | 'split',
    customNotes = ''
  ) => {
    const cust = customers[custIndex % customers.length];
    const rate = gheeType === 'cow' ? 680 : gheeType === 'buffalo' ? 740 : 700;
    const isGhee = true;
    const productName =
      gheeType === 'cow'
        ? 'Pure Desi Cow Ghee'
        : gheeType === 'buffalo'
        ? 'Bilona Buffalo Desi Ghee'
        : 'Desi Ghee (Mix)';
    const itemTotal = Math.round(weightKg * rate);
    const subtotal = itemTotal;
    const isLoyalty = custIndex % 2 === 0;
    const discountPercent = isLoyalty ? 5 : 0;
    const discountAmount = isLoyalty ? Math.round((subtotal * 5) / 100) : 0;
    const totalAmount = subtotal - discountAmount;

    let cashReceived = 0;
    let onlineReceived = 0;
    let pendingAmount = 0;

    if (mode === 'cash') {
      cashReceived = totalAmount;
    } else if (mode === 'online') {
      onlineReceived = totalAmount;
    } else {
      cashReceived = Math.round(totalAmount * 0.6);
      pendingAmount = totalAmount - cashReceived; // some credit
    }

    const sale: Sale = {
      id: `sale_seed_${saleIdCounter++}`,
      invoiceNo: `INV-${invCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      date: `${dateStr}T${timeStr}:00.000Z`,
      items: [
        {
          productId: gheeType === 'cow' ? 'prod_1' : 'prod_2',
          productName,
          quantityKg: Math.round(weightKg * 1000) / 1000,
          ratePerKg: rate,
          total: itemTotal,
          isGhee,
        },
      ],
      subtotal,
      discountPercent,
      discountAmount,
      totalAmount,
      paymentMode: mode,
      cashReceived,
      onlineReceived,
      pendingAmount,
      isLoyaltyDiscountApplied: isLoyalty,
      loyaltySchemeActivatedKg: weightKg,
      notes: customNotes || (isLoyalty ? '5% Loyalty repeat discount' : 'Regular retail sale'),
    };
    sales.push(sale);
    return sale;
  };

  // Helper to record a purchase
  const addPurchase = (
    dateStr: string,
    timeStr: string,
    cat: 'raw_cream' | 'wholesale_ghee' | 'shop_expense',
    title: string,
    supplier: string,
    qty: number,
    rate: number,
    mode: 'cash' | 'online',
    notes: string
  ) => {
    const totalAmount = qty > 0 && rate > 0 ? Math.round(qty * rate) : rate || 500;
    const pur: PurchaseExpense = {
      id: `pur_seed_${purIdCounter++}`,
      date: `${dateStr}T${timeStr}:00.000Z`,
      category: cat,
      title,
      supplierOrPayee: supplier,
      quantityKg: qty > 0 ? qty : undefined,
      ratePerKg: rate > 0 ? rate : undefined,
      totalAmount,
      paymentMode: mode,
      notes,
    };
    purchasesExpenses.push(pur);
    return pur;
  };

  // Helper to record a khata collection
  const addKhata = (
    dateStr: string,
    timeStr: string,
    custIndex: number,
    amount: number,
    mode: 'cash' | 'online',
    note: string
  ) => {
    const cust = customers[custIndex % customers.length];
    const kp: KhataPayment = {
      id: `khata_seed_${khataIdCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      date: `${dateStr}T${timeStr}:00.000Z`,
      amount,
      paymentMode: mode,
      note,
    };
    khataPayments.push(kp);
    return kp;
  };

  // Helper to configure a day's cash drawer with opening cash and withdrawals with explicit reasons
  const configureDrawerForDay = (
    dateStr: string,
    openingCash: number,
    withdrawals: { time: string; amount: number; reason: string }[],
    additions: { time: string; amount: number; reason: string }[] = []
  ) => {
    const withdrawnCash = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const addedCash = additions.reduce((sum, a) => sum + a.amount, 0);

    const withdrawalsList = withdrawals.map((w, idx) => ({
      id: `wm_${dateStr}_${idx + 1}`,
      time: w.time,
      amount: w.amount,
      reason: w.reason,
      type: 'withdraw' as const,
    }));

    const additionsList = additions.map((a, idx) => ({
      id: `am_${dateStr}_${idx + 1}`,
      time: a.time,
      amount: a.amount,
      reason: a.reason,
      type: 'add' as const,
    }));

    const notesSummary = withdrawalsList.map((w) => `₹${w.amount}: ${w.reason}`).join(' | ');

    cashDrawer[dateStr] = {
      id: `drawer_${dateStr}`,
      date: dateStr,
      openingCash,
      addedCash,
      withdrawnCash,
      notes: notesSummary || 'Standard counter day',
      withdrawalsList,
      additionsList,
    };

    denominations[dateStr] = {
      500: Math.floor((openingCash * 0.6) / 500),
      200: Math.floor((openingCash * 0.2) / 200),
      100: Math.floor((openingCash * 0.15) / 100),
      50: 10,
      20: 10,
      10: 20,
      coins: 50,
    };
  };

  // -------------------------------------------------------------
  // 1. POPULATE COMPLETED FULL MONTH: AUGUST 2026 (All 31 days!)
  // -------------------------------------------------------------
  for (let day = 1; day <= 31; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-08-${dayStr}`;
    const opening = 8000 + (day % 5) * 500;

    // 2 to 4 sales per day
    const numSales = 2 + (day % 3);
    for (let s = 0; s < numSales; s++) {
      const custIdx = (day + s) % customers.length;
      const weight = [0.5, 1.0, 1.5, 2.0, 5.0, 0.25][(day + s) % 6];
      const gheeType = (['cow', 'buffalo', 'cow'] as const)[(day + s) % 3];
      const mode = (['cash', 'online', 'cash', 'split'] as const)[(day * 2 + s) % 4];
      const hour = String(9 + (s * 3)).padStart(2, '0');
      addSale(dateStr, `${hour}:20`, custIdx, gheeType, weight, mode);
    }

    // Purchases every 2 days
    if (day % 2 === 1) {
      addPurchase(
        dateStr,
        '08:15',
        'raw_cream',
        'Raw Fresh Cream (कच्ची मलाई)',
        'Babulal Dairy Village',
        18 + (day % 8),
        300,
        day % 4 === 1 ? 'cash' : 'online',
        'Morning dairy cream supply'
      );
    }
    if (day % 7 === 0) {
      addPurchase(
        dateStr,
        '14:00',
        'wholesale_ghee',
        'Wholesale Desi Ghee Tin (15kg)',
        'Aggarwal Mandi Depot',
        15,
        580,
        'online',
        'Wholesale buffer stock'
      );
    }
    if (day % 5 === 0) {
      addPurchase(
        dateStr,
        '16:30',
        'shop_expense',
        'Ghee Glass Jars & Packaging',
        'Shree Packaging Works',
        0,
        450 + (day % 3) * 100,
        'cash',
        '1kg & 2kg seal jars'
      );
    }

    // Khata payment collection every 3 days
    if (day % 3 === 0) {
      addKhata(
        dateStr,
        '17:30',
        (day + 1) % customers.length,
        800 + (day % 4) * 400,
        day % 2 === 0 ? 'cash' : 'online',
        'Udhaar khata partial settlement'
      );
    }

    // Daily withdrawals with reason
    const withdrawalList: { time: string; amount: number; reason: string }[] = [];
    if (day % 2 === 0) {
      const reason = withdrawalReasons[(day / 2) % withdrawalReasons.length];
      const amt = 2000 + (day % 6) * 500;
      withdrawalList.push({
        time: '19:45',
        amount: amt,
        reason,
      });
    }
    if (day === 15 || day === 31) {
      withdrawalList.push({
        time: '20:15',
        amount: 8000,
        reason: 'Bank Deposit - Transfer to PNB Current A/c (बैंक में जमा)',
      });
    }

    configureDrawerForDay(dateStr, opening, withdrawalList);
  }

  // -------------------------------------------------------------
  // 2. POPULATE CURRENT MONTH: SEPTEMBER 2026 (Days 1 to 13)
  // -------------------------------------------------------------
  for (let day = 1; day <= 13; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-09-${dayStr}`;
    const opening = 9000 + (day % 4) * 500;

    // 2-3 sales per day
    for (let s = 0; s < 3; s++) {
      const custIdx = (day * 3 + s) % customers.length;
      const weight = [1.0, 2.0, 0.5, 3.0, 1.5][(day + s) % 5];
      const gheeType = (['cow', 'buffalo', 'cow'] as const)[(day + s) % 3];
      const mode = (['cash', 'online', 'cash'] as const)[s % 3];
      const hour = String(10 + s * 3).padStart(2, '0');
      addSale(dateStr, `${hour}:15`, custIdx, gheeType, weight, mode);
    }

    // Alternate day cream purchases
    if (day % 2 === 1) {
      addPurchase(
        dateStr,
        '08:30',
        'raw_cream',
        'Raw Fresh Dairy Cream (ताज़ा मलाई)',
        'Kisan Dudh Sangh',
        20 + (day % 5),
        310,
        'cash',
        'Daily morning supply'
      );
    }

    // Cash withdrawals
    const withdrawalList: { time: string; amount: number; reason: string }[] = [];
    if (day % 2 === 1) {
      withdrawalList.push({
        time: '19:30',
        amount: 2500 + (day % 3) * 500,
        reason: withdrawalReasons[(day + 2) % withdrawalReasons.length],
      });
    }
    if (day === 10) {
      withdrawalList.push({
        time: '14:00',
        amount: 10000,
        reason: 'Deposited into PNB Current Bank Account (पीएनबी बैंक जमा)',
      });
    }

    configureDrawerForDay(dateStr, opening, withdrawalList);
  }

  // -------------------------------------------------------------
  // 3. POPULATE FY 2026-27 EARLIER MONTHS (April, May, June, July 2026)
  // -------------------------------------------------------------
  const months2026 = [
    { m: '04', days: 30, avgSalesPerMonth: 22 },
    { m: '05', days: 31, avgSalesPerMonth: 24 },
    { m: '06', days: 30, avgSalesPerMonth: 25 },
    { m: '07', days: 31, avgSalesPerMonth: 26 },
  ];
  months2026.forEach(({ m, days }) => {
    // Pick 10 representative days per month to give strong realistic monthly totals
    for (let d = 1; d <= days; d += 3) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `2026-${m}-${dayStr}`;
      addSale(dateStr, '11:00', d % customers.length, 'cow', 2.0, 'cash');
      addSale(dateStr, '16:00', (d + 1) % customers.length, 'buffalo', 1.5, 'online');
      if (d % 2 === 0) {
        addSale(dateStr, '18:30', (d + 2) % customers.length, 'cow', 5.0, 'cash', 'Family function bulk pack');
      }

      addPurchase(
        dateStr,
        '08:00',
        'raw_cream',
        'Raw Cream (मलाई)',
        'Babulal Dairy',
        25,
        290,
        'cash',
        'Bulk cream lot'
      );

      const wList: { time: string; amount: number; reason: string }[] = [];
      if (d % 6 === 0) {
        wList.push({
          time: '20:00',
          amount: 5000,
          reason: 'Papaji cash withdrawal for house and bank deposit',
        });
      }
      configureDrawerForDay(dateStr, 8000, wList);
    }
  });

  // -------------------------------------------------------------
  // 4. POPULATE FY 2025-26 (All 12 Months: April 2025 - March 2026)
  // -------------------------------------------------------------
  const fy2025_26_months = [
    { year: 2025, m: '04', label: 'Apr 2025', festiveMultiplier: 1.0 },
    { year: 2025, m: '05', label: 'May 2025', festiveMultiplier: 1.1 },
    { year: 2025, m: '06', label: 'Jun 2025', festiveMultiplier: 1.0 },
    { year: 2025, m: '07', label: 'Jul 2025', festiveMultiplier: 1.1 },
    { year: 2025, m: '08', label: 'Aug 2025 (Raksha Bandhan)', festiveMultiplier: 1.4 },
    { year: 2025, m: '09', label: 'Sep 2025 (Janmashtami)', festiveMultiplier: 1.3 },
    { year: 2025, m: '10', label: 'Oct 2025 (Diwali Peak)', festiveMultiplier: 1.8 },
    { year: 2025, m: '11', label: 'Nov 2025 (Wedding Season)', festiveMultiplier: 1.6 },
    { year: 2025, m: '12', label: 'Dec 2025 (Winter demand)', festiveMultiplier: 1.3 },
    { year: 2026, m: '01', label: 'Jan 2026 (Winter Sankranti)', festiveMultiplier: 1.4 },
    { year: 2026, m: '02', label: 'Feb 2026 (Maha Shivratri)', festiveMultiplier: 1.2 },
    { year: 2026, m: '03', label: 'Mar 2026 (Holi & Year End)', festiveMultiplier: 1.3 },
  ];

  fy2025_26_months.forEach(({ year, m, festiveMultiplier }) => {
    // 8 to 10 representative transactional days in every month
    const step = festiveMultiplier > 1.4 ? 2 : 3;
    for (let day = 1; day <= 28; day += step) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${m}-${dayStr}`;

      const sCount = Math.round(2 * festiveMultiplier);
      for (let sc = 0; sc < sCount; sc++) {
        const cIdx = (day + sc) % customers.length;
        const w = (1 + (sc % 3)) * (festiveMultiplier > 1.5 ? 2.5 : 1);
        const mode = sc % 2 === 0 ? 'cash' : 'online';
        addSale(dateStr, `${11 + sc * 2}:30`, cIdx, 'cow', w, mode);
      }

      addPurchase(
        dateStr,
        '08:00',
        'raw_cream',
        'Raw Cream (मलाई)',
        'Village Dairy Coop',
        Math.round(20 * festiveMultiplier),
        280,
        'cash',
        'Routine procurement'
      );

      const wList: { time: string; amount: number; reason: string }[] = [];
      if (day % 6 === 1) {
        wList.push({
          time: '19:45',
          amount: Math.round(3000 * festiveMultiplier),
          reason: 'Papaji cash withdrawal for household expense (पापाजी ने निकाले)',
        });
      }
      if (day === 28) {
        wList.push({
          time: '20:15',
          amount: 12000,
          reason: 'Bank Deposit - Monthly saving transferred to PNB Bank A/c',
        });
      }
      configureDrawerForDay(dateStr, 7500, wList);
    }
  });

  // -------------------------------------------------------------
  // 5. POPULATE FY 2024-25 (All 12 Months: April 2024 - March 2025)
  // -------------------------------------------------------------
  const fy2024_25_months = [
    { year: 2024, m: '04', festiveMultiplier: 1.0 },
    { year: 2024, m: '05', festiveMultiplier: 1.0 },
    { year: 2024, m: '06', festiveMultiplier: 0.9 },
    { year: 2024, m: '07', festiveMultiplier: 1.0 },
    { year: 2024, m: '08', festiveMultiplier: 1.3 },
    { year: 2024, m: '09', festiveMultiplier: 1.2 },
    { year: 2024, m: '10', festiveMultiplier: 1.7 }, // Diwali
    { year: 2024, m: '11', festiveMultiplier: 1.5 },
    { year: 2024, m: '12', festiveMultiplier: 1.2 },
    { year: 2025, m: '01', festiveMultiplier: 1.3 },
    { year: 2025, m: '02', festiveMultiplier: 1.1 },
    { year: 2025, m: '03', festiveMultiplier: 1.2 },
  ];

  fy2024_25_months.forEach(({ year, m, festiveMultiplier }) => {
    for (let day = 2; day <= 28; day += 3) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${m}-${dayStr}`;

      const sCount = Math.round(2 * festiveMultiplier);
      for (let sc = 0; sc < sCount; sc++) {
        const cIdx = (day + sc) % customers.length;
        const w = (1 + (sc % 2)) * (festiveMultiplier > 1.4 ? 2 : 1);
        addSale(dateStr, `${12 + sc * 2}:00`, cIdx, 'buffalo', w, sc % 2 === 0 ? 'cash' : 'online');
      }

      addPurchase(
        dateStr,
        '08:15',
        'raw_cream',
        'Raw Cream Lot',
        'Rampur Gaushala Dairy',
        Math.round(18 * festiveMultiplier),
        260,
        'cash',
        'Pure milk cream lot'
      );

      const wList: { time: string; amount: number; reason: string }[] = [];
      if (day % 6 === 2) {
        wList.push({
          time: '19:30',
          amount: 2500,
          reason: 'Papaji cash withdrawal for domestic expense',
        });
      }
      configureDrawerForDay(dateStr, 7000, wList);
    }
  });

  return {
    sales,
    khataPayments,
    purchasesExpenses,
    cashDrawer,
    denominations,
    customers,
  };
}
