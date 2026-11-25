import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Share2,
  Calendar,
  FileText,
  Copy,
  Check,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Building2,
  Droplet,
  ChevronRight,
  Award,
  Download,
  ExternalLink,
  Info,
  CalendarRange,
  Loader2,
  Send,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import {
  AppData,
  BusinessSettings,
  CashDrawerEntry,
  Customer,
  FinancialYear,
  KhataPayment,
  ProductItem,
  PurchaseExpense,
  Sale,
} from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  FINANCIAL_YEARS,
  getDaysInMonthString,
  getFinancialYearFromDate,
  getMonthsInFinancialYear,
} from '../utils/financialYear';
import {
  downloadElementAsHtml,
  downloadElementAsImage,
  downloadElementAsPdf,
  isRunningInIframe,
  printElement,
  shareElementAsImage,
  shareElementAsPdf,
} from '../utils/printHelper';
import { getGheeSoldFromSales } from '../utils/gheeHelper';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  sales: Sale[];
  khataPayments: KhataPayment[];
  purchasesExpenses: PurchaseExpense[];
  cashDrawer: Record<string, CashDrawerEntry>;
  customers: Customer[];
  products?: ProductItem[];
  initialMode?: 'day' | 'range' | 'month' | 'year';
  initialDate?: string;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  sales,
  khataPayments,
  purchasesExpenses,
  cashDrawer,
  customers,
  products = [],
  initialMode = 'day',
  initialDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [mode, setMode] = useState<'day' | 'range' | 'month' | 'year'>(initialMode);
  const [selectedFY, setSelectedFY] = useState<FinancialYear>(
    initialDate ? getFinancialYearFromDate(initialDate) : '2026-27'
  );
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialDate ? initialDate.substring(0, 7) : '2026-08' // Defaults to August 2026 for 31-day completed view
  );

  // Custom Date Range State (e.g. 1st Oct to 10th Oct)
  const [rangeStartDate, setRangeStartDate] = useState<string>(() => {
    if (initialDate) {
      const parts = initialDate.split('-');
      if (parts.length === 3) return `${parts[0]}-${parts[1]}-01`;
    }
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [rangeEndDate, setRangeEndDate] = useState<string>(initialDate || todayStr);

  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [recordsPhone, setRecordsPhone] = useState<string>('');
  const [pdfShareInfo, setPdfShareInfo] = useState<{
    kind: 'image' | 'pdf';
    filename: string;
    whatsappUrl: string;
    downloaded: boolean;
    sharedViaWebShare: boolean;
    canWebShareFiles?: boolean;
    blob?: Blob;
    blobUrl?: string;
    dataUrl?: string;
    file?: File;
    error?: string;
  } | null>(null);

  // Month list for selected FY
  const monthsInSelectedFY = useMemo(() => {
    return getMonthsInFinancialYear(selectedFY);
  }, [selectedFY]);

  // If FY changes, ensure selectedMonth belongs to it
  const handleFYChange = (fy: FinancialYear) => {
    setSelectedFY(fy);
    const months = getMonthsInFinancialYear(fy);
    if (months.length > 0) {
      setSelectedMonth(months[0].key);
      const days = getDaysInMonthString(months[0].key);
      if (days.length > 0) {
        setSelectedDate(days[0]);
      }
    }
  };

  // -------------------------------------------------------------
  // 1. DAY REPORT DATA CALCULATION
  // -------------------------------------------------------------
  const daySales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(selectedDate));
  }, [sales, selectedDate]);

  const dayKhata = useMemo(() => {
    return khataPayments.filter((kp) => kp.date.startsWith(selectedDate));
  }, [khataPayments, selectedDate]);

  const dayPurchases = useMemo(() => {
    return purchasesExpenses.filter((pe) => pe.date.startsWith(selectedDate));
  }, [purchasesExpenses, selectedDate]);

  const dayDrawer = cashDrawer[selectedDate] || {
    id: `drawer_${selectedDate}`,
    date: selectedDate,
    openingCash: 0,
    addedCash: 0,
    withdrawnCash: 0,
  };

  const daySalesCash = daySales.reduce((sum, s) => sum + (s.cashReceived || 0), 0);
  const daySalesOnline = daySales.reduce((sum, s) => sum + (s.onlineReceived || 0), 0);
  const daySalesCredit = daySales.reduce((sum, s) => sum + (s.pendingAmount || 0), 0);
  const daySalesTotal = daySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const dayKhataCash = dayKhata
    .filter((k) => k.paymentMode === 'cash')
    .reduce((sum, k) => sum + k.amount, 0);
  const dayKhataOnline = dayKhata
    .filter((k) => k.paymentMode === 'online')
    .reduce((sum, k) => sum + k.amount, 0);

  const dayCashInTotal = daySalesCash + dayKhataCash + (dayDrawer.addedCash || 0);
  const dayOnlineInTotal = daySalesOnline + dayKhataOnline + (dayDrawer.addedBank || 0);

  const dayPurchasesCash = dayPurchases
    .filter((p) => p.paymentMode === 'cash')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const dayPurchasesOnline = dayPurchases
    .filter((p) => p.paymentMode === 'online')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const dayCashOutTotal = dayPurchasesCash + (dayDrawer.withdrawnCash || 0);
  const dayOnlineOutTotal = dayPurchasesOnline + (dayDrawer.withdrawnBank || 0);

  const dayClosingCash = dayDrawer.openingCash + dayCashInTotal - dayCashOutTotal;
  const dayClosingBank = (dayDrawer.openingBank || 0) + dayOnlineInTotal - dayOnlineOutTotal;

  const dayGheeSoldKg = getGheeSoldFromSales(daySales, products);

  const dayCreamProcuredKg = dayPurchases
    .filter((p) => p.category === 'raw_cream')
    .reduce((sum, p) => sum + (p.quantityKg || 0), 0);

  // -------------------------------------------------------------
  // 1B. CUSTOM DATE RANGE REPORT DATA CALCULATION
  // -------------------------------------------------------------
  const rangeSales = useMemo(() => {
    return sales
      .filter((s) => {
        const d = s.date.split('T')[0];
        return d >= rangeStartDate && d <= rangeEndDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, rangeStartDate, rangeEndDate]);

  const rangeKhata = useMemo(() => {
    return khataPayments
      .filter((kp) => {
        const d = kp.date.split('T')[0];
        return d >= rangeStartDate && d <= rangeEndDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [khataPayments, rangeStartDate, rangeEndDate]);

  const rangePurchases = useMemo(() => {
    return purchasesExpenses
      .filter((pe) => {
        const d = pe.date.split('T')[0];
        return d >= rangeStartDate && d <= rangeEndDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [purchasesExpenses, rangeStartDate, rangeEndDate]);

  const rangeSalesCash = useMemo(() => rangeSales.reduce((sum, s) => sum + (s.cashReceived || 0), 0), [rangeSales]);
  const rangeSalesOnline = useMemo(() => rangeSales.reduce((sum, s) => sum + (s.onlineReceived || 0), 0), [rangeSales]);
  const rangeSalesCredit = useMemo(() => rangeSales.reduce((sum, s) => sum + (s.pendingAmount || 0), 0), [rangeSales]);
  const rangeSalesTotal = useMemo(() => rangeSales.reduce((sum, s) => sum + s.totalAmount, 0), [rangeSales]);

  const rangeKhataCash = useMemo(() => rangeKhata
    .filter((k) => k.paymentMode === 'cash')
    .reduce((sum, k) => sum + k.amount, 0), [rangeKhata]);
  const rangeKhataOnline = useMemo(() => rangeKhata
    .filter((k) => k.paymentMode === 'online')
    .reduce((sum, k) => sum + k.amount, 0), [rangeKhata]);

  const rangeCashInTotal = rangeSalesCash + rangeKhataCash;
  const rangeOnlineInTotal = rangeSalesOnline + rangeKhataOnline;

  const rangePurchasesCash = useMemo(() => rangePurchases
    .filter((p) => p.paymentMode === 'cash')
    .reduce((sum, p) => sum + p.totalAmount, 0), [rangePurchases]);
  const rangePurchasesOnline = useMemo(() => rangePurchases
    .filter((p) => p.paymentMode === 'online')
    .reduce((sum, p) => sum + p.totalAmount, 0), [rangePurchases]);

  const rangePurchasesTotal = rangePurchasesCash + rangePurchasesOnline;

  const rangeGheeSoldKg = useMemo(() => {
    return getGheeSoldFromSales(rangeSales, products);
  }, [rangeSales, products]);

  const rangeCreamProcuredKg = useMemo(() => {
    return rangePurchases
      .filter((p) => p.category === 'raw_cream')
      .reduce((sum, p) => sum + (p.quantityKg || 0), 0);
  }, [rangePurchases]);

  interface RangeDayRow {
    date: string;
    billsCount: number;
    salesTotal: number;
    gheeKg: number;
    cashIn: number;
    onlineIn: number;
    purchasesTotal: number;
    netDay: number;
  }

  const rangeDailyBreakdown = useMemo(() => {
    const dateMap = new Map<string, RangeDayRow>();

    const start = new Date(rangeStartDate);
    const end = new Date(rangeEndDate);
    const cur = new Date(start);
    while (cur <= end) {
      const dStr = cur.toISOString().split('T')[0];
      dateMap.set(dStr, {
        date: dStr,
        billsCount: 0,
        salesTotal: 0,
        gheeKg: 0,
        cashIn: 0,
        onlineIn: 0,
        purchasesTotal: 0,
        netDay: 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    rangeSales.forEach((s) => {
      const d = s.date.split('T')[0];
      const entry = dateMap.get(d) || {
        date: d,
        billsCount: 0,
        salesTotal: 0,
        gheeKg: 0,
        cashIn: 0,
        onlineIn: 0,
        purchasesTotal: 0,
        netDay: 0,
      };
      entry.billsCount += 1;
      entry.salesTotal += s.totalAmount;
      entry.cashIn += (s.cashReceived || 0);
      entry.onlineIn += (s.onlineReceived || 0);
      const ghee = s.items
        .filter((it) => it.isGhee || it.productName.toLowerCase().includes('ghee') || it.productName.includes('घी'))
        .reduce((sum, it) => sum + (it.quantityKg || 0), 0);
      entry.gheeKg += ghee;
      dateMap.set(d, entry);
    });

    rangeKhata.forEach((k) => {
      const d = k.date.split('T')[0];
      const entry = dateMap.get(d);
      if (entry) {
        if (k.paymentMode === 'cash') entry.cashIn += k.amount;
        else entry.onlineIn += k.amount;
      }
    });

    rangePurchases.forEach((p) => {
      const d = p.date.split('T')[0];
      const entry = dateMap.get(d);
      if (entry) {
        entry.purchasesTotal += p.totalAmount;
      }
    });

    dateMap.forEach((entry) => {
      entry.netDay = (entry.cashIn + entry.onlineIn) - entry.purchasesTotal;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rangeSales, rangeKhata, rangePurchases, rangeStartDate, rangeEndDate]);

  // -------------------------------------------------------------
  // 2. MONTH REPORT DATA CALCULATION (Day-by-Day Table with Cumulative)
  // -------------------------------------------------------------
  const monthDays = useMemo(() => {
    return getDaysInMonthString(selectedMonth);
  }, [selectedMonth]);

  interface MonthDayRow {
    date: string;
    dayNumber: number;
    salesCash: number;
    salesOnline: number;
    khataAmount: number;
    totalInflow: number;
    purchasesAmount: number;
    withdrawnCash: number;
    totalOutflow: number;
    netCashflow: number;
    gheeSoldKg: number;
    cumulativeInflow: number;
    withdrawalReasons: string;
  }

  const monthRows = useMemo(() => {
    let runningCumulativeInflow = 0;
    const rows: MonthDayRow[] = [];

    monthDays.forEach((dStr, idx) => {
      const dSales = sales.filter((s) => s.date.startsWith(dStr));
      const dKhata = khataPayments.filter((k) => k.date.startsWith(dStr));
      const dPurchases = purchasesExpenses.filter((p) => p.date.startsWith(dStr));
      const dDrawer = cashDrawer[dStr];

      const sCash = dSales.reduce((sum, s) => sum + (s.cashReceived || 0), 0);
      const sOnline = dSales.reduce((sum, s) => sum + (s.onlineReceived || 0), 0);
      const kAmt = dKhata.reduce((sum, k) => sum + k.amount, 0);
      const totInflow = sCash + sOnline + kAmt + (dDrawer?.addedCash || 0) + (dDrawer?.addedBank || 0);

      const pAmt = dPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const wCash = (dDrawer?.withdrawnCash || 0) + (dDrawer?.withdrawnBank || 0);
      const totOutflow = pAmt + wCash;

      const net = totInflow - totOutflow;

      const gKg = getGheeSoldFromSales(dSales, products);

      runningCumulativeInflow += totInflow;

      let reasonsArr: string[] = [];
      if (dDrawer?.withdrawalsList && dDrawer.withdrawalsList.length > 0) {
        reasonsArr.push(...dDrawer.withdrawalsList.map((w) => `Cash: ${w.reason}`));
      }
      if (dDrawer?.bankWithdrawalsList && dDrawer.bankWithdrawalsList.length > 0) {
        reasonsArr.push(...dDrawer.bankWithdrawalsList.map((w) => `Bank: ${w.reason}`));
      }
      if (reasonsArr.length === 0 && dDrawer?.notes) {
        reasonsArr.push(dDrawer.notes);
      }
      const reasons = reasonsArr.join(', ');

      rows.push({
        date: dStr,
        dayNumber: idx + 1,
        salesCash: sCash,
        salesOnline: sOnline,
        khataAmount: kAmt,
        totalInflow: totInflow,
        purchasesAmount: pAmt,
        withdrawnCash: wCash,
        totalOutflow: totOutflow,
        netCashflow: net,
        gheeSoldKg: gKg,
        cumulativeInflow: runningCumulativeInflow,
        withdrawalReasons: reasons,
      });
    });

    return rows;
  }, [monthDays, sales, khataPayments, purchasesExpenses, cashDrawer]);

  const monthTotalInflow = monthRows.reduce((sum, r) => sum + r.totalInflow, 0);
  const monthTotalPurchases = monthRows.reduce((sum, r) => sum + r.purchasesAmount, 0);
  const monthTotalWithdrawn = monthRows.reduce((sum, r) => sum + r.withdrawnCash, 0);
  const monthTotalOutflow = monthRows.reduce((sum, r) => sum + r.totalOutflow, 0);
  const monthTotalGheeKg = monthRows.reduce((sum, r) => sum + r.gheeSoldKg, 0);

  // -------------------------------------------------------------
  // 3. YEAR REPORT DATA CALCULATION (Month-by-Month with Cumulative)
  // -------------------------------------------------------------
  interface YearMonthRow {
    monthKey: string;
    monthLabel: string;
    salesTotal: number;
    gheeSoldKg: number;
    purchasesTotal: number;
    creamProcuredKg: number;
    withdrawnCash: number;
    netProfit: number;
    cumulativeTurnover: number;
  }

  const yearRows = useMemo(() => {
    let runningTurnover = 0;
    const rows: YearMonthRow[] = [];

    monthsInSelectedFY.forEach((mInfo) => {
      const mSales = sales.filter((s) => s.date.startsWith(mInfo.key));
      const mPurchases = purchasesExpenses.filter((p) => p.date.startsWith(mInfo.key));

      const sTot = mSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const pTot = mPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

      const gKg = getGheeSoldFromSales(mSales, products);

      const cKg = mPurchases
        .filter((p) => p.category === 'raw_cream')
        .reduce((sum, p) => sum + (p.quantityKg || 0), 0);

      // Sum all withdrawals in that month from cashDrawer
      let wSum = 0;
      Object.keys(cashDrawer).forEach((dateKey) => {
        if (dateKey.startsWith(mInfo.key)) {
          wSum += cashDrawer[dateKey]?.withdrawnCash || 0;
        }
      });

      runningTurnover += sTot;

      rows.push({
        monthKey: mInfo.key,
        monthLabel: mInfo.label,
        salesTotal: sTot,
        gheeSoldKg: gKg,
        purchasesTotal: pTot,
        creamProcuredKg: cKg,
        withdrawnCash: wSum,
        netProfit: sTot - pTot,
        cumulativeTurnover: runningTurnover,
      });
    });

    return rows;
  }, [monthsInSelectedFY, sales, purchasesExpenses, cashDrawer]);

  const yearTotalTurnover = yearRows.reduce((sum, r) => sum + r.salesTotal, 0);
  const yearTotalPurchases = yearRows.reduce((sum, r) => sum + r.purchasesTotal, 0);
  const yearTotalWithdrawn = yearRows.reduce((sum, r) => sum + r.withdrawnCash, 0);
  const yearTotalGheeKg = yearRows.reduce((sum, r) => sum + r.gheeSoldKg, 0);
  const yearTotalNetProfit = yearTotalTurnover - yearTotalPurchases;

  // -------------------------------------------------------------
  // PRINT & EXPORT HANDLERS
  // -------------------------------------------------------------
  const getDocumentTitle = () => {
    if (mode === 'day') return `Daily_Audit_${selectedDate}_${settings.shopName.replace(/\s+/g, '_')}`;
    if (mode === 'range') return `Date_Range_${rangeStartDate}_to_${rangeEndDate}_${settings.shopName.replace(/\s+/g, '_')}`;
    if (mode === 'month') return `Month_Statement_${selectedMonth}_${settings.shopName.replace(/\s+/g, '_')}`;
    return `Annual_FY_${selectedFY}_${settings.shopName.replace(/\s+/g, '_')}`;
  };

  const handlePrint = () => {
    const docTitle = getDocumentTitle();
    printElement('printable-report-area', docTitle);
  };

  const handleDownload = () => {
    const docTitle = getDocumentTitle();
    downloadElementAsHtml('printable-report-area', `${docTitle}.html`, docTitle);
  };

  const handleDownloadPhoto = async () => {
    setIsGeneratingPdf(true);
    setImageCopied(false);
    const docTitle = getDocumentTitle();
    const summaryText = generateWhatsAppMessage();
    const targetPhone = recordsPhone.replace(/\D/g, '');
    const waUrl = targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(summaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;

    try {
      const res = await downloadElementAsImage('printable-report-area', `${docTitle}.png`);
      setPdfShareInfo({
        kind: 'image',
        filename: res.filename,
        whatsappUrl: waUrl,
        downloaded: res.success,
        sharedViaWebShare: false,
        canWebShareFiles:
          res.file && typeof (navigator as any).canShare === 'function'
            ? Boolean((navigator as any).canShare({ files: [res.file] }))
            : false,
        blob: res.blob,
        blobUrl: res.blobUrl,
        dataUrl: res.dataUrl,
        file: res.file,
        error: res.success ? undefined : res.error || 'Could not generate report photo. Please try Print.',
      });
    } catch (err: any) {
      setPdfShareInfo({
        kind: 'image',
        filename: `${docTitle}.png`,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate report photo. Please try Print.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setImageCopied(false);
    const docTitle = getDocumentTitle();
    const summaryText = generateWhatsAppMessage();
    const targetPhone = recordsPhone.replace(/\D/g, '');
    const waUrl = targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(summaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;

    try {
      const res = await downloadElementAsPdf('printable-report-area', `${docTitle}.pdf`);
      setPdfShareInfo({
        kind: 'pdf',
        filename: res.filename,
        whatsappUrl: waUrl,
        downloaded: res.success,
        sharedViaWebShare: false,
        canWebShareFiles: typeof (navigator as any).canShare === 'function',
        blobUrl: res.blobUrl,
        error: res.success ? undefined : res.error || 'Could not generate PDF. Please try Photo or Print.',
      });
    } catch (err: any) {
      setPdfShareInfo({
        kind: 'pdf',
        filename: `${docTitle}.pdf`,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate PDF. Please try Photo or Print.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Message Composer
  const generateWhatsAppMessage = () => {
    let msg = `🧈 *${settings.shopName}*\n`;
    msg += `📍 ${settings.address} | 📞 ${settings.phone}\n`;
    msg += `═══════════════════════\n`;

    if (mode === 'day') {
      msg += `📋 *DAILY AUDIT REPORT (दैनिक हिसाब)*\n`;
      msg += `📅 *Date:* ${selectedDate}\n\n`;

      msg += `*CASH & SALES SUMMARY:*\n`;
      msg += `• Morning Opening Cash: ${formatCurrency(dayDrawer.openingCash)}\n`;
      msg += `• Total Sales: ${formatCurrency(daySalesTotal)} (${daySales.length} bills)\n`;
      msg += `• Ghee Sold: ${dayGheeSoldKg.toFixed(3)} kg\n`;
      msg += `• Cash Received: ${formatCurrency(daySalesCash)}\n`;
      msg += `• Online / UPI Received: ${formatCurrency(daySalesOnline)}\n`;
      if (daySalesCredit > 0) {
        msg += `• New Credit (Udhaar): ${formatCurrency(daySalesCredit)}\n`;
      }
      if (dayKhataCash + dayKhataOnline > 0) {
        msg += `• Khata Collected: ${formatCurrency(dayKhataCash + dayKhataOnline)}\n`;
      }
      msg += `\n*EXPENSES & OUTFLOW:*\n`;
      msg += `• Purchases/Expenses: ${formatCurrency(dayPurchasesCash + dayPurchasesOnline)}\n`;
      if (dayCreamProcuredKg > 0) {
        msg += `• Raw Cream Procured: ${dayCreamProcuredKg.toFixed(3)} kg\n`;
      }
      msg += `• Cash Withdrawn by Owner: ${formatCurrency(dayDrawer.withdrawnCash || 0)}\n`;

      if (dayDrawer.withdrawalsList && dayDrawer.withdrawalsList.length > 0) {
        msg += `\n*WITHDRAWAL REASONS:*\n`;
        dayDrawer.withdrawalsList.forEach((w) => {
          msg += ` - ₹${w.amount} (${w.time}): ${w.reason}\n`;
        });
      } else if (dayDrawer.notes) {
        msg += ` Note: ${dayDrawer.notes}\n`;
      }

      msg += `═══════════════════════\n`;
      msg += `💰 *Closing Cash in Hand:* ${formatCurrency(dayClosingCash)}\n`;
      msg += `🏦 *Net Online Bank Inflow:* ${formatCurrency(dayOnlineInTotal - dayPurchasesOnline)}\n`;
    } else if (mode === 'range') {
      msg += `📋 *CUSTOM DATE RANGE STATEMENT (कस्टम अवधि हिसाब)*\n`;
      msg += `📅 *Period:* ${rangeStartDate} to ${rangeEndDate} (${rangeDailyBreakdown.length} Days)\n\n`;

      msg += `*SALES & VOLUME:*\n`;
      msg += `• Total Sales: ${formatCurrency(rangeSalesTotal)} (${rangeSales.length} bills)\n`;
      msg += `• Pure Ghee Sold: ${rangeGheeSoldKg.toFixed(3)} kg\n`;
      msg += `• Cash Sales Received: ${formatCurrency(rangeSalesCash)}\n`;
      msg += `• Online / UPI Received: ${formatCurrency(rangeSalesOnline)}\n`;
      if (rangeSalesCredit > 0) {
        msg += `• New Credit (Udhaar): ${formatCurrency(rangeSalesCredit)}\n`;
      }
      if (rangeKhataCash + rangeKhataOnline > 0) {
        msg += `• Khata (Udhaar) Collected: ${formatCurrency(rangeKhataCash + rangeKhataOnline)}\n`;
      }

      msg += `\n*PURCHASES & EXPENSES:*\n`;
      msg += `• Total Purchases/Expenses: ${formatCurrency(rangePurchasesTotal)} (${rangePurchases.length} items)\n`;
      if (rangeCreamProcuredKg > 0) {
        msg += `• Raw Cream Procured: ${rangeCreamProcuredKg.toFixed(3)} kg\n`;
      }

      msg += `\n═══════════════════════\n`;
      msg += `💰 *Total Cash Collected:* ${formatCurrency(rangeCashInTotal)}\n`;
      msg += `🏦 *Total Online Bank Inflow:* ${formatCurrency(rangeOnlineInTotal)}\n`;
      msg += `📈 *Net Operating Balance:* ${formatCurrency(rangeSalesTotal - rangePurchasesTotal)}\n`;
    } else if (mode === 'month') {
      msg += `📊 *MONTHLY CUMULATIVE STATEMENT (मासिक हिसाब)*\n`;
      msg += `🗓️ *Month:* ${selectedMonth} (${monthDays.length} Days)\n\n`;
      msg += `• Total Gross Inflow: ${formatCurrency(monthTotalInflow)}\n`;
      msg += `• Total Ghee Sold: ${monthTotalGheeKg.toFixed(3)} kg\n`;
      msg += `• Purchases & Raw Cream: ${formatCurrency(monthTotalPurchases)}\n`;
      msg += `• Cash Withdrawn: ${formatCurrency(monthTotalWithdrawn)}\n`;
      msg += `• Net Cashflow: ${formatCurrency(monthTotalInflow - monthTotalOutflow)}\n\n`;
      msg += `*DAILY PROGRESSION (Sample Days):*\n`;
      monthRows
        .filter((r) => r.totalInflow > 0 || r.totalOutflow > 0)
        .slice(0, 8)
        .forEach((r) => {
          msg += `• Day ${r.dayNumber}: Inflow ${formatCurrency(r.totalInflow)} | Cumul: ${formatCurrency(r.cumulativeInflow)}\n`;
        });
      msg += `\n═══════════════════════\n`;
      msg += `✅ *Final Month Cumulative Turnover:* ${formatCurrency(monthTotalInflow)}\n`;
    } else {
      msg += `📈 *ANNUAL FINANCIAL STATEMENT (वार्षिक हिसाब)*\n`;
      msg += `🏛️ *Financial Year:* FY ${selectedFY}\n\n`;
      msg += `• Annual Sales Turnover: ${formatCurrency(yearTotalTurnover)}\n`;
      msg += `• Total Ghee Volume: ${yearTotalGheeKg.toFixed(3)} kg\n`;
      msg += `• Raw Cream & Material: ${formatCurrency(yearTotalPurchases)}\n`;
      msg += `• Gross Operating Profit: ${formatCurrency(yearTotalNetProfit)}\n`;
      msg += `• Total Owner Withdrawals: ${formatCurrency(yearTotalWithdrawn)}\n\n`;
      msg += `*MONTHLY BREAKDOWN:*\n`;
      yearRows.forEach((r) => {
        if (r.salesTotal > 0) {
          msg += `• ${r.monthLabel}: Sales ${formatCurrency(r.salesTotal)} | Ghee ${r.gheeSoldKg.toFixed(1)}kg | Cumul: ${formatCurrency(r.cumulativeTurnover)}\n`;
        }
      });
      msg += `\n═══════════════════════\n`;
      msg += `🏆 *Cumulative FY Turnover:* ${formatCurrency(yearTotalTurnover)}\n`;
    }

    return msg;
  };

  // WhatsApp Message Share (Text summary)
  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Photo Share (Captures statement photograph via WebShare or Download + WhatsApp)
  const handleShareWhatsAppPhoto = async () => {
    setIsGeneratingPdf(true);
    setImageCopied(false);
    const docTitle = getDocumentTitle();
    const summaryText = generateWhatsAppMessage();
    const periodLabel =
      mode === 'range'
        ? `${rangeStartDate} to ${rangeEndDate}`
        : mode === 'day'
        ? selectedDate
        : mode === 'month'
        ? selectedMonth
        : `FY ${selectedFY}`;

    const targetPhone = recordsPhone.replace(/\D/g, '');
    const caption = `🧈 *${settings.shopName}*\n🖼️ *Official Statement Photo (${periodLabel})*\n\n${summaryText}`;
    const waUrl = targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(caption)}`
      : `https://wa.me/?text=${encodeURIComponent(caption)}`;

    try {
      const res = await shareElementAsImage('printable-report-area', `${docTitle}.png`, {
        title: `${settings.shopName} - ${docTitle}`,
        text: caption,
        whatsappFallbackUrl: waUrl,
      });

      setPdfShareInfo({
        kind: 'image',
        filename: res.filename,
        whatsappUrl: waUrl,
        downloaded: res.downloaded,
        sharedViaWebShare: res.sharedViaWebShare,
        canWebShareFiles: res.canWebShareFiles,
        blob: res.blob,
        blobUrl: res.blobUrl,
        dataUrl: res.dataUrl,
        file: res.file,
        error: res.error,
      });
    } catch (err: any) {
      console.error('Error sharing WhatsApp Photo:', err);
      setPdfShareInfo({
        kind: 'image',
        filename: `${docTitle}.png`,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not capture statement photo. Please try Print.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp PDF Share (Actual PDF via WebShare or Download + WhatsApp)
  const handleShareWhatsAppPdf = async () => {
    setIsGeneratingPdf(true);
    setImageCopied(false);
    const docTitle = getDocumentTitle();
    const summaryText = generateWhatsAppMessage();
    const periodLabel =
      mode === 'range'
        ? `${rangeStartDate} to ${rangeEndDate}`
        : mode === 'day'
        ? selectedDate
        : mode === 'month'
        ? selectedMonth
        : `FY ${selectedFY}`;

    const targetPhone = recordsPhone.replace(/\D/g, '');
    const caption = `🧈 *${settings.shopName}*\n📄 *Official Statement PDF (${periodLabel})*\n\n📎 Official statement attached for record maintenance.\n\n${summaryText}`;
    const waUrl = targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(caption)}`
      : `https://wa.me/?text=${encodeURIComponent(caption)}`;

    try {
      const res = await shareElementAsPdf('printable-report-area', `${docTitle}.pdf`, {
        title: `${settings.shopName} - ${docTitle}`,
        text: caption,
        whatsappFallbackUrl: waUrl,
      });

      setPdfShareInfo({
        kind: 'pdf',
        filename: res.filename,
        whatsappUrl: waUrl,
        downloaded: res.downloaded,
        sharedViaWebShare: res.sharedViaWebShare,
        canWebShareFiles: res.canWebShareFiles,
        blob: res.blob,
        blobUrl: res.blobUrl,
        file: res.file,
        error: res.error,
      });
    } catch (err: any) {
      console.error('Error sharing WhatsApp PDF:', err);
      setPdfShareInfo({
        kind: 'pdf',
        filename: `${docTitle}.pdf`,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate PDF. Please try Photo or Print.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyPhoto = async () => {
    if (!pdfShareInfo?.blob || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      return;
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pdfShareInfo.blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2500);
    } catch (err) {
      console.warn('Copy report photo failed:', err);
    }
  };

  const handleCopyText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-1 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-stone-200 my-1 sm:my-4 flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden">
        {/* Top Control Header (Hidden in Print) */}
        <div className="no-print p-3 sm:p-4 bg-stone-900 text-white border-b border-stone-800 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Export Statement & PDF Report
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Audit grade ledger for Day, Custom Date Range (1 to 10 Oct etc.), Month, or Financial Year
              </p>
            </div>

            {/* Prominent Cross / Close Button - always visible and accessible */}
            <button
              onClick={onClose}
              className="p-2 -mr-1 -mt-1 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 bg-stone-800/60 active:scale-95 transition cursor-pointer shrink-0"
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons row with smooth horizontal scroll on small devices */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Primary Print / Save PDF */}
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Print or Save as PDF via browser print"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            {/* WhatsApp Photo Button (Fast Image Mode) */}
            <button
              onClick={handleShareWhatsAppPhoto}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="WhatsApp Photo: Captures crisp statement photo to send directly on WhatsApp"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>WhatsApp Photo (फोटो भेजें)</span>
            </button>

            {/* WhatsApp PDF Button */}
            <button
              onClick={handleShareWhatsAppPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="WhatsApp PDF: Sends or downloads multi-page PDF document"
            >
              <FileText className="w-4 h-4" />
              <span>WhatsApp PDF</span>
            </button>

            {/* WhatsApp Message Button (Existing Text Summary) */}
            <button
              onClick={handleShareWhatsApp}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-bold shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Share formatted WhatsApp text summary"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Msg</span>
            </button>

            {/* Direct Download Photo */}
            <button
              onClick={handleDownloadPhoto}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Download report photograph (PNG)"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Save Photo</span>
            </button>

            {/* Direct Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Download direct PDF file to your device"
            >
              <FileText className="w-4 h-4" />
              <span>Save PDF</span>
            </button>

            {/* Download HTML */}
            <button
              onClick={handleDownload}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Download standalone HTML document"
            >
              <span>HTML</span>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Feedback & WhatsApp Photo/PDF Action Panel */}
          {pdfShareInfo && (
            <div
              className={`mt-2.5 p-3 rounded-xl border text-xs space-y-2.5 max-h-[42vh] overflow-y-auto ${
                pdfShareInfo.error
                  ? 'bg-rose-950 border-rose-700 text-rose-100'
                  : 'bg-emerald-950 border-emerald-700 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {pdfShareInfo.error ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-bold text-white">
                    {pdfShareInfo.error
                      ? pdfShareInfo.error
                      : pdfShareInfo.sharedViaWebShare
                      ? pdfShareInfo.kind === 'image'
                        ? 'Statement Photo Sent via Share Sheet!'
                        : 'Statement PDF Sent via Share Sheet!'
                      : pdfShareInfo.downloaded
                      ? pdfShareInfo.kind === 'image'
                        ? 'Statement Photo Ready & Saved!'
                        : 'Statement PDF Downloaded to Device!'
                      : pdfShareInfo.kind === 'image'
                      ? 'Statement Photo Ready!'
                      : 'Statement PDF Ready!'}
                  </span>
                </div>
                <button
                  onClick={() => setPdfShareInfo(null)}
                  className="opacity-80 hover:opacity-100 p-0.5 text-xs cursor-pointer"
                  aria-label="Dismiss panel"
                >
                  ✕
                </button>
              </div>

              {pdfShareInfo.dataUrl && !pdfShareInfo.error && (
                <div className="bg-white rounded-xl p-2 border border-emerald-700/60 text-center space-y-1">
                  <img
                    src={pdfShareInfo.dataUrl}
                    alt="Statement Photo Preview"
                    className="max-h-44 w-auto mx-auto rounded-lg object-contain border border-stone-200"
                  />
                  <p className="text-[10px] text-stone-500">
                    Tip: Long-press the statement photo above on your phone to Save or Share directly.
                  </p>
                </div>
              )}

              {!pdfShareInfo.error && (
                <div className="flex flex-wrap items-center gap-2">
                  {(pdfShareInfo.blobUrl || pdfShareInfo.dataUrl) && (
                    <a
                      href={pdfShareInfo.blobUrl || pdfShareInfo.dataUrl}
                      download={pdfShareInfo.filename}
                      type={pdfShareInfo.kind === 'image' ? 'image/png' : 'application/pdf'}
                      onClick={() =>
                        setPdfShareInfo((prev) => (prev ? { ...prev, downloaded: true } : prev))
                      }
                      className="px-3 py-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {pdfShareInfo.kind === 'image'
                          ? pdfShareInfo.downloaded
                            ? 'Save Photo Again'
                            : 'Save Photo (PNG)'
                          : pdfShareInfo.downloaded
                          ? 'Download PDF Again'
                          : 'Save PDF to Phone'}
                      </span>
                    </a>
                  )}

                  {pdfShareInfo.file && pdfShareInfo.canWebShareFiles && (
                    <button
                      onClick={async () => {
                        try {
                          await (navigator as any).share({
                            files: [pdfShareInfo.file],
                            title: `${settings.shopName} - ${pdfShareInfo.filename}`,
                            text: generateWhatsAppMessage(),
                          });
                          setPdfShareInfo((prev) =>
                            prev ? { ...prev, sharedViaWebShare: true } : prev
                          );
                        } catch {
                          // Cancelled
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      {pdfShareInfo.kind === 'image' ? (
                        <ImageIcon className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {pdfShareInfo.kind === 'image'
                          ? 'Share Photo via WhatsApp'
                          : 'Share PDF via WhatsApp'}
                      </span>
                    </button>
                  )}

                  {pdfShareInfo.kind === 'image' &&
                    pdfShareInfo.blob &&
                    typeof ClipboardItem !== 'undefined' &&
                    Boolean(navigator.clipboard?.write) && (
                      <button
                        onClick={handleCopyPhoto}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        {imageCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{imageCopied ? 'Photo Copied!' : 'Copy Photo'}</span>
                      </button>
                    )}
                </div>
              )}

              <div className="bg-emerald-900/80 p-2.5 rounded-lg border border-emerald-700/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[11px] text-emerald-200 font-medium whitespace-nowrap">
                    Record Mobile / WhatsApp:
                  </span>
                  <div className="relative flex-1 max-w-[200px]">
                    <span className="absolute left-2 top-1.5 text-xs font-bold text-emerald-400">+91</span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={recordsPhone}
                      onChange={(e) => setRecordsPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-2 py-1 text-xs rounded bg-emerald-950 text-white border border-emerald-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <a
                  href={
                    recordsPhone
                      ? `https://wa.me/91${recordsPhone}?text=${encodeURIComponent(
                          `🧈 *${settings.shopName}*\n${
                            pdfShareInfo.kind === 'image'
                              ? '🖼️ Official Statement Photo'
                              : '📄 Official Statement PDF'
                          } (${
                            mode === 'range'
                              ? `${rangeStartDate} to ${rangeEndDate}`
                              : mode === 'day'
                              ? selectedDate
                              : mode === 'month'
                              ? selectedMonth
                              : `FY ${selectedFY}`
                          })\nAttached for record maintenance.`
                        )}`
                      : pdfShareInfo.whatsappUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp (व्हाट्सएप खोलें)</span>
                </a>
              </div>

              {!pdfShareInfo.sharedViaWebShare && !pdfShareInfo.error && (
                <p className="text-[10.5px] text-emerald-300">
                  <strong>File:</strong>{' '}
                  <code className="text-white font-mono bg-emerald-950 px-1 py-0.5 rounded">
                    {pdfShareInfo.filename}
                  </code>
                  .{' '}
                  {pdfShareInfo.kind === 'image'
                    ? 'Tap "Open WhatsApp" and attach from Gallery (📎 → Gallery) or paste if copied.'
                    : 'Tap "Save PDF to Phone" if needed, then "Open WhatsApp" and attach from Downloads (📎 → Document).'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preview Mode Helper Notice */}
        {isRunningInIframe() && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Quick Tip:</strong> Use <strong>WhatsApp PDF</strong> or <strong>Download PDF</strong> for instant direct PDF files. For printing, use <strong>Print / Save PDF</strong>.
              </span>
            </div>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open App in New Tab</span>
            </button>
          </div>
        )}

        {/* Filter Navigation Bar (Hidden in Print) */}
        <div className="no-print bg-stone-100 p-2.5 sm:p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          {/* Mode Switcher */}
          <div className="flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs text-xs font-bold overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setMode('day')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-center ${
                mode === 'day'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Day (दिन का हिसाब)
            </button>
            <button
              onClick={() => setMode('range')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-center flex items-center justify-center gap-1 ${
                mode === 'range'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Date Range (कस्टम तारीख अवधि)</span>
            </button>
            <button
              onClick={() => setMode('month')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-center ${
                mode === 'month'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Month (माह - 31 दिन)
            </button>
            <button
              onClick={() => setMode('year')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-center ${
                mode === 'year'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Year (वर्ष - 12 माह)
            </button>
          </div>

          {/* Period Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* FY Selector (relevant for Year or FY tracking) */}
            {(mode === 'year' || mode === 'month') && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-600 whitespace-nowrap">FY:</span>
                <select
                  value={selectedFY}
                  onChange={(e) => handleFYChange(e.target.value as FinancialYear)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 text-xs shadow-2xs"
                >
                  {FINANCIAL_YEARS.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Day: Date Picker with quick jump */}
            {mode === 'day' && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-600 whitespace-nowrap">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedFY(getFinancialYearFromDate(e.target.value));
                  }}
                  className="px-2.5 py-1 rounded-xl border border-stone-300 bg-white font-medium text-stone-900 text-xs shadow-2xs"
                />
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setSelectedFY(getFinancialYearFromDate(todayStr));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-[11px] font-bold text-stone-700 cursor-pointer"
                >
                  Today
                </button>
              </div>
            )}

            {/* If Custom Date Range: Start Date & End Date Pickers + Quick Presets */}
            {mode === 'range' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-stone-600 whitespace-nowrap text-[11px]">From:</span>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-stone-300 bg-white font-bold text-stone-900 text-xs shadow-2xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-stone-600 whitespace-nowrap text-[11px]">To:</span>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-stone-300 bg-white font-bold text-stone-900 text-xs shadow-2xs"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      // 1st to 10th of current month (exact user example)
                      const parts = (rangeEndDate || todayStr).split('-');
                      const y = parts[0];
                      const m = parts[1];
                      setRangeStartDate(`${y}-${m}-01`);
                      setRangeEndDate(`${y}-${m}-10`);
                    }}
                    className="px-2 py-1 rounded-md bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700 cursor-pointer"
                    title="Select 1st to 10th of this month"
                  >
                    1-10 Oct
                  </button>
                  <button
                    onClick={() => {
                      // 1st of month to today
                      const parts = todayStr.split('-');
                      setRangeStartDate(`${parts[0]}-${parts[1]}-01`);
                      setRangeEndDate(todayStr);
                    }}
                    className="px-2 py-1 rounded-md bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700 cursor-pointer"
                    title="1st of this month to today"
                  >
                    Month to Date
                  </button>
                  <button
                    onClick={() => {
                      // Last 7 days
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 6);
                      setRangeStartDate(start.toISOString().split('T')[0]);
                      setRangeEndDate(end.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 rounded-md bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700 cursor-pointer"
                  >
                    7 Days
                  </button>
                </div>
              </div>
            )}

            {/* If Month: Month Dropdown */}
            {mode === 'month' && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-600 whitespace-nowrap">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 text-xs shadow-2xs"
                >
                  {monthsInSelectedFY.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.daysInMonth} Days)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-8 bg-stone-50">
          <div
            id="printable-report-area"
            className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-4 sm:space-y-6 text-stone-900 print:p-0 print:border-none print:shadow-none"
          >
            {/* Formal Shop Letterhead */}
            <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 block">
                  Official Audit & Accounting Statement
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
                  {settings.shopName}
                </h1>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  {settings.address} • Phone: {settings.phone} • Prop: {settings.ownerName}
                </p>
              </div>

              <div className="text-left sm:text-right bg-stone-50 p-2.5 rounded-xl border border-stone-200 print:border-none print:p-0">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {mode === 'day'
                    ? 'Daily Transaction Register'
                    : mode === 'range'
                    ? 'Date Range Audit Register'
                    : mode === 'month'
                    ? 'Monthly Cumulative Register'
                    : 'Annual Financial Statement'}
                </span>
                <span className="text-base font-black font-mono text-amber-800">
                  {mode === 'day'
                    ? selectedDate
                    : mode === 'range'
                    ? `${rangeStartDate} to ${rangeEndDate}`
                    : mode === 'month'
                    ? `${selectedMonth} (${monthDays.length} Days)`
                    : `FY ${selectedFY}`}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Generated: {new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* MODE 1: PARTICULAR DAY REPORT (Inputs, Outputs, Withdrawals) */}
            {/* ========================================================= */}
            {mode === 'day' && (
              <div className="space-y-6">
                {/* Day Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Morning Opening Cash</span>
                    <span className="text-lg font-black font-mono text-stone-900">
                      {formatCurrency(dayDrawer.openingCash)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Day Cash In</span>
                    <span className="text-lg font-black font-mono text-emerald-800">
                      +{formatCurrency(dayCashInTotal)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">Sales + Collections</span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Total Day Cash Out</span>
                    <span className="text-lg font-black font-mono text-rose-800">
                      -{formatCurrency(dayCashOutTotal)}
                    </span>
                    <span className="text-[10px] text-rose-600 block">Expenses + Withdrawals</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Closing Cash in Hand</span>
                    <span className="text-lg font-black font-mono text-amber-900">
                      {formatCurrency(dayClosingCash)}
                    </span>
                    <span className="text-[10px] text-amber-700 block">Actual Drawer Cash</span>
                  </div>
                </div>

                {/* Additional Row: Online & Ghee Volume */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Online / UPI Inflow</span>
                    <span className="text-base font-bold font-mono text-indigo-900">
                      {formatCurrency(dayOnlineInTotal)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Ghee Sold</span>
                    <span className="text-base font-bold font-mono text-amber-900">
                      {dayGheeSoldKg.toFixed(3)} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-600 uppercase block">Raw Cream Procured</span>
                    <span className="text-base font-bold font-mono text-stone-900">
                      {dayCreamProcuredKg.toFixed(3)} kg
                    </span>
                  </div>
                </div>

                {/* Section A: ALL INPUTS (Sales, Khata, Added Cash) */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-300 pb-1.5 gap-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1. All Inputs & Collections (कुल आवक / प्राप्तियां)</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 sm:bg-transparent px-2 sm:px-0 py-0.5 rounded self-start sm:self-auto">
                      Total: {formatCurrency(daySalesTotal + dayKhataCash + dayKhataOnline + (dayDrawer.addedCash || 0))}
                    </span>
                  </div>

                  {daySales.length === 0 && dayKhata.length === 0 && (dayDrawer.addedCash || 0) === 0 ? (
                    <p className="text-xs text-stone-400 py-3 text-center">No sales or collections recorded on this date.</p>
                  ) : (
                    <div className="border border-stone-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                        <thead>
                          <tr className="bg-stone-100 text-[10px] font-bold text-stone-600 uppercase border-b border-stone-200">
                            <th className="py-1.5 px-2">Type / Bill</th>
                            <th className="py-1.5 px-2">Customer / Payee</th>
                            <th className="py-1.5 px-2">Items / Weight</th>
                            <th className="py-1.5 px-2">Mode</th>
                            <th className="py-1.5 px-2 text-right">Cash ₹</th>
                            <th className="py-1.5 px-2 text-right">Online ₹</th>
                            <th className="py-1.5 px-2 text-right">Total ₹</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                          {daySales.map((s) => (
                            <tr key={s.id} className="hover:bg-stone-50">
                              <td className="py-1.5 px-2 font-bold text-stone-800">
                                {s.invoiceNo}
                              </td>
                              <td className="py-1.5 px-2 font-sans font-medium text-stone-900">
                                {s.customerName}
                                {s.notes && <span className="text-[10px] text-stone-400 block font-normal">{s.notes}</span>}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-700">
                                {s.items.map((it) => `${it.quantityKg.toFixed(3)}kg ${it.productName}${it.testPercentage ? ` (${it.testPercentage}% test)` : ''}`).join(', ')}
                              </td>
                              <td className="py-1.5 px-2 uppercase text-[10px] font-bold text-stone-500">
                                {s.paymentMode}
                              </td>
                              <td className="py-1.5 px-2 text-right text-emerald-700 font-bold">
                                {s.cashReceived > 0 ? formatCurrency(s.cashReceived) : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right text-indigo-700 font-bold">
                                {s.onlineReceived > 0 ? formatCurrency(s.onlineReceived) : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-stone-900">
                                {formatCurrency(s.totalAmount)}
                              </td>
                            </tr>
                          ))}

                          {dayKhata.map((k) => (
                            <tr key={k.id} className="bg-emerald-50/40">
                              <td className="py-1.5 px-2 font-bold text-emerald-800 font-sans">
                                Khata Collection
                              </td>
                              <td className="py-1.5 px-2 font-sans font-medium text-stone-900">
                                {k.customerName}
                                {k.note && <span className="text-[10px] text-stone-400 block font-normal">{k.note}</span>}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-400">Udhaar Recovery</td>
                              <td className="py-1.5 px-2 uppercase text-[10px] font-bold text-stone-500">
                                {k.paymentMode}
                              </td>
                              <td className="py-1.5 px-2 text-right text-emerald-700 font-bold">
                                {k.paymentMode === 'cash' ? formatCurrency(k.amount) : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right text-indigo-700 font-bold">
                                {k.paymentMode === 'online' ? formatCurrency(k.amount) : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-stone-900">
                                {formatCurrency(k.amount)}
                              </td>
                            </tr>
                          ))}

                          {(dayDrawer.addedCash || 0) > 0 && (
                            <tr className="bg-amber-50/50">
                              <td className="py-1.5 px-2 font-bold text-amber-800 font-sans">Cash Inflow</td>
                              <td className="py-1.5 px-2 font-sans font-medium text-stone-900">
                                Cash Added to Drawer (गल्ले में नकद डाला)
                                <span className="text-[10px] text-stone-500 block font-normal">{dayDrawer.notes || ''}</span>
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-400">-</td>
                              <td className="py-1.5 px-2 uppercase text-[10px] font-bold text-stone-500">Cash</td>
                              <td className="py-1.5 px-2 text-right text-emerald-700 font-bold">
                                {formatCurrency(dayDrawer.addedCash)}
                              </td>
                              <td className="py-1.5 px-2 text-right">-</td>
                              <td className="py-1.5 px-2 text-right font-bold text-stone-900">
                                {formatCurrency(dayDrawer.addedCash)}
                              </td>
                            </tr>
                          )}

                          {(dayDrawer.addedBank || 0) > 0 && (
                            <tr className="bg-indigo-50/50">
                              <td className="py-1.5 px-2 font-bold text-indigo-800 font-sans">Bank Inflow</td>
                              <td className="py-1.5 px-2 font-sans font-medium text-stone-900">
                                Money Added to Bank Account (बैंक में जमा)
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-400">-</td>
                              <td className="py-1.5 px-2 uppercase text-[10px] font-bold text-stone-500">Online/Bank</td>
                              <td className="py-1.5 px-2 text-right">-</td>
                              <td className="py-1.5 px-2 text-right text-indigo-700 font-bold">
                                {formatCurrency(dayDrawer.addedBank)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-stone-900">
                                {formatCurrency(dayDrawer.addedBank)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section B: ALL OUTPUTS (Purchases, Raw Cream & Shop Expenses) */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-300 pb-1.5 gap-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>2. All Outputs, Procurements & Expenses (खरीद व खर्च)</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 sm:bg-transparent px-2 sm:px-0 py-0.5 rounded self-start sm:self-auto">
                      Total: {formatCurrency(dayPurchasesCash + dayPurchasesOnline)}
                    </span>
                  </div>

                  {dayPurchases.length === 0 ? (
                    <p className="text-xs text-stone-400 py-3 text-center">No purchases or expenses recorded on this date.</p>
                  ) : (
                    <div className="border border-stone-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                        <thead>
                          <tr className="bg-stone-100 text-[10px] font-bold text-stone-600 uppercase border-b border-stone-200">
                            <th className="py-1.5 px-2">Category</th>
                            <th className="py-1.5 px-2">Item Description</th>
                            <th className="py-1.5 px-2">Supplier / Payee</th>
                            <th className="py-1.5 px-2">Qty / Rate</th>
                            <th className="py-1.5 px-2">Mode</th>
                            <th className="py-1.5 px-2 text-right">Amount ₹</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                          {dayPurchases.map((p) => (
                            <tr key={p.id} className="hover:bg-stone-50">
                              <td className="py-1.5 px-2 font-sans font-bold text-stone-800">
                                {p.category === 'raw_cream'
                                  ? 'Raw Cream'
                                  : p.category === 'wholesale_ghee'
                                  ? 'Wholesale Ghee'
                                  : 'Shop Expense'}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-900">
                                {p.title}
                                {p.notes && <span className="text-[10px] text-stone-400 block font-normal">{p.notes}</span>}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-700">
                                {p.supplierOrPayee}
                              </td>
                              <td className="py-1.5 px-2 text-stone-600">
                                {p.quantityKg ? `${p.quantityKg.toFixed(3)}kg @ ₹${p.ratePerKg || '-'}` : '-'}
                              </td>
                              <td className="py-1.5 px-2 uppercase text-[10px] font-bold text-stone-500">
                                {p.paymentMode}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-rose-700">
                                {formatCurrency(p.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section C: CASH & BANK WITHDRAWALS WITH SPECIFIC REASONS */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-300 pb-1.5 gap-1">
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>3. Cash Withdrawals from Drawer with Reasons (गल्ले से नकद निकासी विवरण)</span>
                      </h3>
                      <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 sm:bg-transparent px-2 sm:px-0 py-0.5 rounded self-start sm:self-auto">
                        Total Cash Withdrawn: {formatCurrency(dayDrawer.withdrawnCash || 0)}
                      </span>
                    </div>

                    {(dayDrawer.withdrawnCash || 0) === 0 ? (
                      <p className="text-xs text-stone-400 py-2 text-center">
                        No cash was withdrawn from drawer on this date (शून्य नकद निकासी).
                      </p>
                    ) : (
                      <div className="border border-stone-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-rose-50 text-[10px] font-bold text-rose-800 uppercase border-b border-rose-200">
                              <th className="py-1.5 px-3">Time</th>
                              <th className="py-1.5 px-3">Withdrawal Purpose / Reason (निकासी का कारण)</th>
                              <th className="py-1.5 px-3 text-right">Withdrawn Amount ₹</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                            {dayDrawer.withdrawalsList && dayDrawer.withdrawalsList.length > 0 ? (
                              dayDrawer.withdrawalsList.map((w) => (
                                <tr key={w.id} className="hover:bg-stone-50">
                                  <td className="py-2 px-3 text-stone-500 font-medium">{w.time}</td>
                                  <td className="py-2 px-3 font-sans font-semibold text-stone-900">
                                    {w.reason}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-rose-700">
                                    -{formatCurrency(w.amount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="py-2 px-3 text-stone-500 font-medium">End of Day</td>
                                <td className="py-2 px-3 font-sans font-semibold text-stone-900">
                                  {dayDrawer.notes || 'Cash taken home or deposited to bank by owner'}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-rose-700">
                                  -{formatCurrency(dayDrawer.withdrawnCash)}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Bank Withdrawals Sub-section if any */}
                  {(dayDrawer.withdrawnBank || 0) > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-300 pb-1.5 gap-1">
                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span>Bank Account Withdrawals & Transfers (बैंक से निकासी विवरण)</span>
                        </h3>
                        <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 sm:bg-transparent px-2 sm:px-0 py-0.5 rounded self-start sm:self-auto">
                          Total Bank Withdrawn: {formatCurrency(dayDrawer.withdrawnBank || 0)}
                        </span>
                      </div>

                      <div className="border border-stone-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-indigo-50 text-[10px] font-bold text-indigo-800 uppercase border-b border-indigo-200">
                              <th className="py-1.5 px-3">Time</th>
                              <th className="py-1.5 px-3">Purpose / Reason (बैंक निकासी का कारण)</th>
                              <th className="py-1.5 px-3 text-right">Withdrawn Amount ₹</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                            {dayDrawer.bankWithdrawalsList && dayDrawer.bankWithdrawalsList.length > 0 ? (
                              dayDrawer.bankWithdrawalsList.map((w) => (
                                <tr key={w.id} className="hover:bg-stone-50">
                                  <td className="py-2 px-3 text-stone-500 font-medium">{w.time}</td>
                                  <td className="py-2 px-3 font-sans font-semibold text-stone-900">
                                    {w.reason}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-rose-700">
                                    -{formatCurrency(w.amount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="py-2 px-3 text-stone-500 font-medium">Bank Transfer</td>
                                <td className="py-2 px-3 font-sans font-semibold text-stone-900">
                                  Bank ATM / Personal Withdrawal
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-rose-700">
                                  -{formatCurrency(dayDrawer.withdrawnBank)}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section D: Final Reconciliation Balance Sheet */}
                <div className="bg-stone-100 p-4 rounded-xl border border-stone-300 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Day Balance & Cash Reconciliation Summary (दैनिक मिलान)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between font-semibold text-stone-800">
                        <span className="font-sans">Physical Cash Drawer:</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Opening Drawer Cash:</span>
                        <span className="font-bold">{formatCurrency(dayDrawer.openingCash)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span className="font-sans">+ Cash Received (Sales + Khata + Added):</span>
                        <span className="font-bold">+{formatCurrency(dayCashInTotal)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span className="font-sans">- Cash Paid (Purchases + Expenses):</span>
                        <span className="font-bold">-{formatCurrency(dayPurchasesCash)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span className="font-sans">- Cash Withdrawn (Taken Home / Bank):</span>
                        <span className="font-bold">-{formatCurrency(dayDrawer.withdrawnCash || 0)}</span>
                      </div>
                      <div className="border-t border-stone-300 pt-1 flex justify-between font-black text-sm text-stone-950">
                        <span className="font-sans">Closing Cash in Hand:</span>
                        <span>{formatCurrency(dayClosingCash)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono sm:border-l sm:border-stone-300 sm:pl-3">
                      <div className="flex justify-between font-semibold text-indigo-900">
                        <span className="font-sans">Online Bank Account:</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span className="font-sans">Opening Bank Balance:</span>
                        <span className="font-bold">{formatCurrency(dayDrawer.openingBank || 0)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-700">
                        <span className="font-sans">+ Online Sales Received:</span>
                        <span className="font-bold">+{formatCurrency(daySalesOnline)}</span>
                      </div>
                      {dayKhataOnline > 0 && (
                        <div className="flex justify-between text-indigo-700">
                          <span className="font-sans">+ Online Khata Recovered:</span>
                          <span className="font-bold">+{formatCurrency(dayKhataOnline)}</span>
                        </div>
                      )}
                      {(dayDrawer.addedBank || 0) > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span className="font-sans">+ Money Added to Bank:</span>
                          <span className="font-bold">+{formatCurrency(dayDrawer.addedBank || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-rose-700">
                        <span className="font-sans">- Online Purchases Paid:</span>
                        <span className="font-bold">-{formatCurrency(dayPurchasesOnline)}</span>
                      </div>
                      {(dayDrawer.withdrawnBank || 0) > 0 && (
                        <div className="flex justify-between text-rose-700">
                          <span className="font-sans">- Withdrawn from Bank:</span>
                          <span className="font-bold">-{formatCurrency(dayDrawer.withdrawnBank || 0)}</span>
                        </div>
                      )}
                      <div className="border-t border-stone-300 pt-1 flex justify-between font-black text-sm text-indigo-950">
                        <span className="font-sans">Expected Closing Bank Balance:</span>
                        <span>{formatCurrency(dayClosingBank)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODE 1B: CUSTOM DATE RANGE REPORT (1st to 10th Oct etc.) */}
            {/* ========================================================= */}
            {mode === 'range' && (
              <div className="space-y-6">
                {/* Range Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-amber-700 text-white shadow-xs">
                    <span className="text-[10px] font-bold text-amber-200 uppercase block">Total Sales Turnover</span>
                    <span className="text-xl font-black font-mono">{formatCurrency(rangeSalesTotal)}</span>
                    <span className="text-[10px] text-amber-100 block">{rangeSales.length} Total Bills</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Pure Ghee Volume Sold</span>
                    <span className="text-xl font-black font-mono text-stone-900">{rangeGheeSoldKg.toFixed(3)} kg</span>
                    <span className="text-[10px] text-stone-500 block">Across {rangeDailyBreakdown.length} days</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Collections (Inflow)</span>
                    <span className="text-xl font-black font-mono text-emerald-800">
                      +{formatCurrency(rangeCashInTotal + rangeOnlineInTotal)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      Cash ₹{rangeCashInTotal.toLocaleString('en-IN')} | UPI ₹{rangeOnlineInTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Purchases & Expenses (Outflow)</span>
                    <span className="text-xl font-black font-mono text-rose-800">
                      -{formatCurrency(rangePurchasesTotal)}
                    </span>
                    <span className="text-[10px] text-rose-600 block">
                      {rangePurchases.length} Items {rangeCreamProcuredKg > 0 ? `(${rangeCreamProcuredKg.toFixed(1)}kg Cream)` : ''}
                    </span>
                  </div>
                </div>

                {/* Sub-strip metrics: Cash vs Bank & Operating Balance */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Physical Cash Inflow</span>
                    <span className="text-sm font-bold font-mono text-stone-900">
                      {formatCurrency(rangeCashInTotal)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Online / UPI Inflow</span>
                    <span className="text-sm font-bold font-mono text-indigo-900">
                      {formatCurrency(rangeOnlineInTotal)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Khata (Udhaar) Recovered</span>
                    <span className="text-sm font-bold font-mono text-amber-900">
                      {formatCurrency(rangeKhataCash + rangeKhataOnline)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-300">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Net Operating Balance</span>
                    <span className="text-sm font-black font-mono text-emerald-900">
                      {formatCurrency(rangeSalesTotal - rangePurchasesTotal)}
                    </span>
                  </div>
                </div>

                {/* Section 1: Daily Progression Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>1. Daily Progression Breakdown ({rangeStartDate} to {rangeEndDate})</span>
                    </h3>
                    <span className="text-[11px] font-bold text-stone-500">
                      Total Days: {rangeDailyBreakdown.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[11px]">
                        <tr>
                          <th className="py-2 px-2.5">Date (तारीख)</th>
                          <th className="py-2 px-2.5 text-center">Bills</th>
                          <th className="py-2 px-2.5 text-right">Sales (₹)</th>
                          <th className="py-2 px-2.5 text-right">Ghee (kg)</th>
                          <th className="py-2 px-2.5 text-right">Cash In (₹)</th>
                          <th className="py-2 px-2.5 text-right">Online In (₹)</th>
                          <th className="py-2 px-2.5 text-right">Expenses (₹)</th>
                          <th className="py-2 px-2.5 text-right font-black">Net Day (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                        {rangeDailyBreakdown.map((row) => (
                          <tr
                            key={row.date}
                            className={row.salesTotal > 0 || row.purchasesTotal > 0 ? 'hover:bg-amber-50/40' : 'text-stone-400'}
                          >
                            <td className="py-1.5 px-2.5 font-bold font-sans text-stone-800">{row.date}</td>
                            <td className="py-1.5 px-2.5 text-center">{row.billsCount}</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-stone-900">
                              {row.salesTotal > 0 ? formatCurrency(row.salesTotal) : '-'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-amber-900 font-bold">
                              {row.gheeKg > 0 ? `${row.gheeKg.toFixed(3)} kg` : '-'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-emerald-700">
                              {row.cashIn > 0 ? formatCurrency(row.cashIn) : '-'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-indigo-700">
                              {row.onlineIn > 0 ? formatCurrency(row.onlineIn) : '-'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-rose-700">
                              {row.purchasesTotal > 0 ? formatCurrency(row.purchasesTotal) : '-'}
                            </td>
                            <td
                              className={`py-1.5 px-2.5 text-right font-bold ${
                                row.netDay >= 0 ? 'text-emerald-800' : 'text-rose-800'
                              }`}
                            >
                              {formatCurrency(row.netDay)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-stone-100 font-bold font-mono text-stone-900 border-t-2 border-stone-300 text-[11px]">
                        <tr>
                          <td className="py-2 px-2.5 font-sans">Total ({rangeDailyBreakdown.length} Days)</td>
                          <td className="py-2 px-2.5 text-center">{rangeSales.length}</td>
                          <td className="py-2 px-2.5 text-right text-amber-900">{formatCurrency(rangeSalesTotal)}</td>
                          <td className="py-2 px-2.5 text-right text-amber-900">{rangeGheeSoldKg.toFixed(3)} kg</td>
                          <td className="py-2 px-2.5 text-right text-emerald-800">+{formatCurrency(rangeCashInTotal)}</td>
                          <td className="py-2 px-2.5 text-right text-indigo-800">+{formatCurrency(rangeOnlineInTotal)}</td>
                          <td className="py-2 px-2.5 text-right text-rose-800">-{formatCurrency(rangePurchasesTotal)}</td>
                          <td className="py-2 px-2.5 text-right font-black text-emerald-900">
                            {formatCurrency(rangeSalesTotal - rangePurchasesTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Section 2: Detailed Sales & Bills Register */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>2. Itemized Sales & Bills Register ({rangeSales.length} Transactions)</span>
                    </h3>
                  </div>

                  {rangeSales.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                      No customer sales bills recorded in this date range.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[10.5px]">
                          <tr>
                            <th className="py-2 px-2">Date & Time</th>
                            <th className="py-2 px-2">Bill #</th>
                            <th className="py-2 px-2">Customer</th>
                            <th className="py-2 px-2">Items Breakdown</th>
                            <th className="py-2 px-2 text-right">Ghee (kg)</th>
                            <th className="py-2 px-2 text-center">Mode</th>
                            <th className="py-2 px-2 text-right">Total (₹)</th>
                            <th className="py-2 px-2 text-right">Paid (₹)</th>
                            <th className="py-2 px-2 text-right">Udhaar (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[10.5px]">
                          {rangeSales.map((s) => {
                            const gheeKg = s.items
                              .filter((it) => it.isGhee || it.productName.toLowerCase().includes('ghee') || it.productName.includes('घी'))
                              .reduce((sum, it) => sum + (it.quantityKg || 0), 0);
                            const itemsText = s.items
                              .map((it) => `${it.productName} (${it.quantityKg}kg @ ₹${it.ratePerKg})`)
                              .join(', ');
                            return (
                              <tr key={s.id} className="hover:bg-stone-50">
                                <td className="py-1.5 px-2 text-stone-500 font-sans whitespace-nowrap">
                                  {s.date.split('T')[0]} {s.date.split('T')[1]?.substring(0, 5) || ''}
                                </td>
                                <td className="py-1.5 px-2 font-bold text-amber-900">{s.invoiceNo}</td>
                                <td className="py-1.5 px-2 font-sans font-medium text-stone-900">
                                  <div>{s.customerName}</div>
                                  {s.customerPhone && (
                                    <span className="text-[9.5px] text-stone-400 block font-mono">{s.customerPhone}</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-2 font-sans text-stone-600 max-w-xs truncate" title={itemsText}>
                                  {itemsText}
                                </td>
                                <td className="py-1.5 px-2 text-right font-bold text-amber-900">
                                  {gheeKg > 0 ? `${gheeKg.toFixed(3)} kg` : '-'}
                                </td>
                                <td className="py-1.5 px-2 text-center uppercase font-sans text-[9px] font-bold">
                                  <span
                                    className={`px-1.5 py-0.5 rounded ${
                                      s.paymentMode === 'cash'
                                        ? 'bg-amber-100 text-amber-800'
                                        : s.paymentMode === 'online'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {s.paymentMode}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-bold text-stone-900">
                                  {formatCurrency(s.totalAmount)}
                                </td>
                                <td className="py-1.5 px-2 text-right text-emerald-700">
                                  {formatCurrency((s.cashReceived || 0) + (s.onlineReceived || 0))}
                                </td>
                                <td className="py-1.5 px-2 text-right text-rose-600 font-bold">
                                  {s.pendingAmount > 0 ? formatCurrency(s.pendingAmount) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-stone-100 font-bold font-mono text-stone-900 border-t-2 border-stone-300 text-[11px]">
                          <tr>
                            <td colSpan={4} className="py-2 px-2 font-sans">
                              Total Sales Register Summary
                            </td>
                            <td className="py-2 px-2 text-right text-amber-900">{rangeGheeSoldKg.toFixed(3)} kg</td>
                            <td></td>
                            <td className="py-2 px-2 text-right text-stone-950">{formatCurrency(rangeSalesTotal)}</td>
                            <td className="py-2 px-2 text-right text-emerald-800">
                              +{formatCurrency(rangeSalesCash + rangeSalesOnline)}
                            </td>
                            <td className="py-2 px-2 text-right text-rose-700 font-bold">
                              {rangeSalesCredit > 0 ? formatCurrency(rangeSalesCredit) : '-'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Purchases & Raw Cream Register */}
                {rangePurchases.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>3. Procurement, Raw Cream & Expense Register ({rangePurchases.length} Items)</span>
                      </h3>
                      <span className="text-[11px] font-bold text-rose-800">
                        Total: {formatCurrency(rangePurchasesTotal)}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[10.5px]">
                          <tr>
                            <th className="py-2 px-2">Date</th>
                            <th className="py-2 px-2">Category</th>
                            <th className="py-2 px-2">Description / Vendor</th>
                            <th className="py-2 px-2 text-right">Quantity (kg)</th>
                            <th className="py-2 px-2 text-right">Rate / Test</th>
                            <th className="py-2 px-2 text-center">Mode</th>
                            <th className="py-2 px-2 text-right font-black">Amount Paid (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[10.5px]">
                          {rangePurchases.map((p) => (
                            <tr key={p.id} className="hover:bg-stone-50">
                              <td className="py-1.5 px-2 text-stone-500 font-sans whitespace-nowrap">{p.date.split('T')[0]}</td>
                              <td className="py-1.5 px-2 font-sans font-semibold text-stone-700 capitalize">
                                {p.category === 'raw_cream'
                                  ? '🥛 Raw Cream'
                                  : p.category === 'wholesale_ghee'
                                  ? '🧈 Wholesale Ghee'
                                  : '📦 Expense'}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-900">{p.description}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-stone-800">
                                {p.quantityKg ? `${p.quantityKg.toFixed(3)} kg` : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right text-stone-600">
                                {p.category === 'raw_cream' && p.testPercentage
                                  ? `${p.testPercentage}% (₹${p.ratePerKg}/kg)`
                                  : p.ratePerKg
                                  ? `₹${p.ratePerKg}/kg`
                                  : '-'}
                              </td>
                              <td className="py-1.5 px-2 text-center uppercase font-sans text-[9px] font-bold">
                                <span
                                  className={`px-1.5 py-0.5 rounded ${
                                    p.paymentMode === 'cash'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {p.paymentMode}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-right font-black text-rose-700">
                                -{formatCurrency(p.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-stone-100 font-bold font-mono text-stone-900 border-t-2 border-stone-300 text-[11px]">
                          <tr>
                            <td colSpan={3} className="py-2 px-2 font-sans">
                              Total Procurement & Expenses
                            </td>
                            <td className="py-2 px-2 text-right">
                              {rangeCreamProcuredKg > 0 ? `${rangeCreamProcuredKg.toFixed(3)} kg Cream` : ''}
                            </td>
                            <td colSpan={2}></td>
                            <td className="py-2 px-2 text-right text-rose-800 font-black">
                              -{formatCurrency(rangePurchasesTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 4: Khata Recoveries Register */}
                {rangeKhata.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>4. Khata Collections Register (उधार वसूली - {rangeKhata.length} Records)</span>
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-800">
                        Total Recovered: +{formatCurrency(rangeKhataCash + rangeKhataOnline)}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[10.5px]">
                          <tr>
                            <th className="py-2 px-2">Date</th>
                            <th className="py-2 px-2">Customer Name</th>
                            <th className="py-2 px-2 text-center">Mode</th>
                            <th className="py-2 px-2">Notes</th>
                            <th className="py-2 px-2 text-right font-black">Collected (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[10.5px]">
                          {rangeKhata.map((k) => (
                            <tr key={k.id} className="hover:bg-stone-50">
                              <td className="py-1.5 px-2 text-stone-500 font-sans whitespace-nowrap">{k.date.split('T')[0]}</td>
                              <td className="py-1.5 px-2 font-sans font-bold text-stone-900">{k.customerName}</td>
                              <td className="py-1.5 px-2 text-center uppercase font-sans text-[9px] font-bold">
                                <span
                                  className={`px-1.5 py-0.5 rounded ${
                                    k.paymentMode === 'cash'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {k.paymentMode}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 font-sans text-stone-500">{k.notes || '-'}</td>
                              <td className="py-1.5 px-2 text-right font-black text-emerald-700">
                                +{formatCurrency(k.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-stone-100 font-bold font-mono text-stone-900 border-t-2 border-stone-300 text-[11px]">
                          <tr>
                            <td colSpan={4} className="py-2 px-2 font-sans">
                              Total Khata Collected ({rangeKhata.length} Receipts)
                            </td>
                            <td className="py-2 px-2 text-right text-emerald-800 font-black">
                              +{formatCurrency(rangeKhataCash + rangeKhataOnline)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 5: Range Reconciliation & Signatures */}
                <div className="bg-stone-100 p-4 rounded-xl border border-stone-300 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Range Financial Verification & Reconciliation (अवधि मिलान सारांश)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] font-bold font-sans text-stone-500 block">TOTAL GROSS INFLOW</span>
                      <span className="text-base font-black text-emerald-800">
                        +{formatCurrency(rangeCashInTotal + rangeOnlineInTotal)}
                      </span>
                      <span className="text-[10px] font-sans text-stone-400 block mt-0.5">
                        Cash: {formatCurrency(rangeCashInTotal)} | Bank: {formatCurrency(rangeOnlineInTotal)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] font-bold font-sans text-stone-500 block">TOTAL EXPENSES & PROCUREMENT</span>
                      <span className="text-base font-black text-rose-800">
                        -{formatCurrency(rangePurchasesTotal)}
                      </span>
                      <span className="text-[10px] font-sans text-stone-400 block mt-0.5">
                        Cash: {formatCurrency(rangePurchasesCash)} | Bank: {formatCurrency(rangePurchasesOnline)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                      <span className="text-[10px] font-bold font-sans text-stone-500 block">NET OPERATING SURPLUS</span>
                      <span className="text-base font-black text-amber-900">
                        {formatCurrency(rangeSalesTotal - rangePurchasesTotal)}
                      </span>
                      <span className="text-[10px] font-sans text-stone-400 block mt-0.5">
                        Sales minus Material & Expenses
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between text-[11px] text-stone-500 font-sans">
                    <div>
                      <span>Record Period: <strong>{rangeStartDate}</strong> to <strong>{rangeEndDate}</strong></span>
                    </div>
                    <div>
                      <span>Authorized Signatory: <strong>{settings.ownerName}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODE 2: PARTICULAR MONTH REPORT (All 30/31 Days Cumulative) */}
            {/* ========================================================= */}
            {mode === 'month' && (
              <div className="space-y-6">
                {/* Monthly Big Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-amber-700 text-white shadow-xs">
                    <span className="text-[10px] font-bold text-amber-200 uppercase block">Monthly Gross Inflow</span>
                    <span className="text-xl font-black font-mono">{formatCurrency(monthTotalInflow)}</span>
                    <span className="text-[10px] text-amber-100 block">Sales & Collections</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Total Ghee Volume</span>
                    <span className="text-xl font-black font-mono text-stone-900">{monthTotalGheeKg.toFixed(3)} kg</span>
                    <span className="text-[10px] text-stone-500 block">Delivered in {monthDays.length} days</span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Total Expenses & Raw Cream</span>
                    <span className="text-xl font-black font-mono text-rose-800">{formatCurrency(monthTotalPurchases)}</span>
                    <span className="text-[10px] text-rose-600 block">Cream & Shop Costs</span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Total Owner Withdrawals</span>
                    <span className="text-xl font-black font-mono text-indigo-800">{formatCurrency(monthTotalWithdrawn)}</span>
                    <span className="text-[10px] text-indigo-600 block">Cash taken home / Bank</span>
                  </div>
                </div>

                {/* Day-by-Day Table with Cumulative Column */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      Day-by-Day Daily & Cumulative Register ({monthDays.length} Days in {selectedMonth})
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      Final Cumulative: {formatCurrency(monthTotalInflow)}
                    </span>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-stone-100 text-[10px] font-bold text-stone-600 uppercase border-b border-stone-200">
                          <th className="py-2 px-2 text-center w-10">Day</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2 text-right">Cash Sales ₹</th>
                          <th className="py-2 px-2 text-right">Online Sales ₹</th>
                          <th className="py-2 px-2 text-right">Day Inflow ₹</th>
                          <th className="py-2 px-2 text-right">Expenses ₹</th>
                          <th className="py-2 px-2 text-right">Withdrawals ₹</th>
                          <th className="py-2 px-2 text-right">Ghee (kg)</th>
                          <th className="py-2 px-2 text-right bg-amber-100/70 text-amber-900 font-black">
                            Cumulative Inflow (संचयी) ₹
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                        {monthRows.map((r) => (
                          <tr
                            key={r.date}
                            className={`hover:bg-stone-50 ${
                              r.totalInflow === 0 && r.totalOutflow === 0 ? 'opacity-60 bg-stone-50/30' : ''
                            }`}
                          >
                            <td className="py-1.5 px-2 text-center font-bold text-stone-500">
                              {r.dayNumber}
                            </td>
                            <td className="py-1.5 px-2 text-stone-800 font-medium">
                              {r.date.split('-')[2]}/{r.date.split('-')[1]}
                            </td>
                            <td className="py-1.5 px-2 text-right text-stone-700">
                              {r.salesCash > 0 ? formatCurrency(r.salesCash) : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-indigo-700">
                              {r.salesOnline > 0 ? formatCurrency(r.salesOnline) : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-800">
                              {r.totalInflow > 0 ? formatCurrency(r.totalInflow) : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-rose-700">
                              {r.purchasesAmount > 0 ? formatCurrency(r.purchasesAmount) : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-stone-700">
                              {r.withdrawnCash > 0 ? (
                                <span title={r.withdrawalReasons} className="text-rose-700 font-semibold cursor-help">
                                  {formatCurrency(r.withdrawnCash)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right text-stone-900">
                              {r.gheeSoldKg > 0 ? `${r.gheeSoldKg.toFixed(3)}` : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-black text-amber-950 bg-amber-50/50">
                              {formatCurrency(r.cumulativeInflow)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-stone-900 text-white font-mono font-bold text-xs">
                          <td colSpan={2} className="py-2.5 px-2 text-center font-sans font-bold uppercase">
                            Grand Month Total
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            {formatCurrency(monthRows.reduce((sum, r) => sum + r.salesCash, 0))}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-200">
                            {formatCurrency(monthRows.reduce((sum, r) => sum + r.salesOnline, 0))}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-300 font-black">
                            {formatCurrency(monthTotalInflow)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-rose-300">
                            {formatCurrency(monthTotalPurchases)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-stone-300">
                            {formatCurrency(monthTotalWithdrawn)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-200">
                            {monthTotalGheeKg.toFixed(3)} kg
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-300 font-black text-sm">
                            {formatCurrency(monthTotalInflow)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODE 3: PARTICULAR YEAR REPORT (12 Months FY with Cumulative) */}
            {/* ========================================================= */}
            {mode === 'year' && (
              <div className="space-y-6">
                {/* Year Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-xs">
                    <span className="text-[10px] font-bold text-amber-200 uppercase block">Annual Sales Turnover</span>
                    <span className="text-xl font-black font-mono">{formatCurrency(yearTotalTurnover)}</span>
                    <span className="text-[10px] text-amber-100 block">Total FY {selectedFY} Revenue</span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Annual Ghee Sold</span>
                    <span className="text-xl font-black font-mono text-stone-900">{yearTotalGheeKg.toFixed(1)} kg</span>
                    <span className="text-[10px] text-stone-500 block">Retail & Wholesale Ghee</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Gross Operating Margin</span>
                    <span className="text-xl font-black font-mono text-emerald-800">{formatCurrency(yearTotalNetProfit)}</span>
                    <span className="text-[10px] text-emerald-600 block">Sales minus Material Costs</span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Owner Annual Withdrawals</span>
                    <span className="text-xl font-black font-mono text-indigo-800">{formatCurrency(yearTotalWithdrawn)}</span>
                    <span className="text-[10px] text-indigo-600 block">Home & Bank Transfer</span>
                  </div>
                </div>

                {/* 12 Months Table with Cumulative Column */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      12 Months Financial Year Register (April to March • FY {selectedFY})
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      Annual Total: {formatCurrency(yearTotalTurnover)}
                    </span>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-stone-100 text-[10px] font-bold text-stone-600 uppercase border-b border-stone-200">
                          <th className="py-2.5 px-3">Month (माह)</th>
                          <th className="py-2.5 px-3 text-right">Sales Revenue ₹</th>
                          <th className="py-2.5 px-3 text-right">Ghee Sold (kg)</th>
                          <th className="py-2.5 px-3 text-right">Raw Cream & Materials ₹</th>
                          <th className="py-2.5 px-3 text-right">Gross Profit ₹</th>
                          <th className="py-2.5 px-3 text-right">Cash Withdrawals ₹</th>
                          <th className="py-2.5 px-3 text-right bg-amber-100/70 text-amber-900 font-black">
                            Cumulative FY Turnover ₹
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                        {yearRows.map((r) => (
                          <tr key={r.monthKey} className="hover:bg-stone-50">
                            <td className="py-2 px-3 font-sans font-bold text-stone-800">
                              {r.monthLabel}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              {r.salesTotal > 0 ? formatCurrency(r.salesTotal) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-stone-900 font-semibold">
                              {r.gheeSoldKg > 0 ? `${r.gheeSoldKg.toFixed(1)} kg` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-rose-700">
                              {r.purchasesTotal > 0 ? formatCurrency(r.purchasesTotal) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-800 font-bold">
                              {r.netProfit !== 0 ? formatCurrency(r.netProfit) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-stone-700">
                              {r.withdrawnCash > 0 ? formatCurrency(r.withdrawnCash) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-amber-950 bg-amber-50/50">
                              {formatCurrency(r.cumulativeTurnover)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-stone-900 text-white font-mono font-bold text-xs">
                          <td className="py-3 px-3 font-sans uppercase font-bold">
                            FY {selectedFY} Annual Total
                          </td>
                          <td className="py-3 px-3 text-right text-amber-300 font-black">
                            {formatCurrency(yearTotalTurnover)}
                          </td>
                          <td className="py-3 px-3 text-right text-amber-200">
                            {yearTotalGheeKg.toFixed(1)} kg
                          </td>
                          <td className="py-3 px-3 text-right text-rose-300">
                            {formatCurrency(yearTotalPurchases)}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-300">
                            {formatCurrency(yearTotalNetProfit)}
                          </td>
                          <td className="py-3 px-3 text-right text-stone-300">
                            {formatCurrency(yearTotalWithdrawn)}
                          </td>
                          <td className="py-3 px-3 text-right text-amber-300 font-black text-sm">
                            {formatCurrency(yearTotalTurnover)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer with Signatures */}
            <div className="border-t border-stone-300 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
              <div>
                <p className="font-semibold text-stone-800">
                  {settings.shopName} - Computerized Account Statement
                </p>
                <p className="text-[10px]">
                  All cash registers, weighing scale inputs, and withdrawals recorded as per shop books.
                </p>
              </div>

              <div className="flex gap-8 text-center">
                <div>
                  <div className="w-32 border-b border-stone-400 mb-1 h-6" />
                  <span className="text-[10px] font-medium text-stone-600">Accountant / Cashier</span>
                </div>
                <div>
                  <div className="w-32 border-b border-stone-400 mb-1 h-6" />
                  <span className="text-[10px] font-medium text-stone-600">Shop Owner / Papaji</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
