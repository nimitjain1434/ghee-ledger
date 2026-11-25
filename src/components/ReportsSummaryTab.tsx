import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Wallet,
  Building2,
  AlertCircle,
  Package,
  Calendar,
  CheckCircle2,
  Droplet,
  Printer,
  FileText,
  Share2,
  ChevronRight,
  BarChart3,
  CalendarRange,
} from 'lucide-react';
import {
  BusinessSettings,
  CashDrawerEntry,
  Customer,
  FinancialYear,
  KhataPayment,
  ProductItem,
  PurchaseExpense,
  Sale,
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { ReportExportModal } from './ReportExportModal';
import { FINANCIAL_YEARS, getFinancialYearFromDate } from '../utils/financialYear';
import { getGheeSoldFromSales } from '../utils/gheeHelper';

interface ReportsSummaryTabProps {
  settings: BusinessSettings;
  sales: Sale[];
  khataPayments: KhataPayment[];
  purchasesExpenses: PurchaseExpense[];
  cashDrawer: Record<string, CashDrawerEntry>;
  customers: Customer[];
  products?: ProductItem[];
}

export const ReportsSummaryTab: React.FC<ReportsSummaryTabProps> = ({
  settings,
  sales,
  khataPayments,
  purchasesExpenses,
  cashDrawer,
  customers,
  products = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [period, setPeriod] = useState<'today' | 'month' | 'fy2627' | 'fy2526' | 'fy2425' | 'all'>('today');
  const [exportModalConfig, setExportModalConfig] = useState<{
    isOpen: boolean;
    mode: 'day' | 'range' | 'month' | 'year';
    date?: string;
  }>({
    isOpen: false,
    mode: 'day',
    date: todayStr,
  });

  // Filter logic
  const filteredSales = sales.filter((s) => {
    if (period === 'today') return s.date.startsWith(todayStr);
    if (period === 'month') return s.date.startsWith(currentMonthStr);
    if (period === 'fy2627') return getFinancialYearFromDate(s.date) === '2026-27';
    if (period === 'fy2526') return getFinancialYearFromDate(s.date) === '2025-26';
    if (period === 'fy2425') return getFinancialYearFromDate(s.date) === '2024-25';
    return true;
  });

  const filteredKhata = khataPayments.filter((kp) => {
    if (period === 'today') return kp.date.startsWith(todayStr);
    if (period === 'month') return kp.date.startsWith(currentMonthStr);
    if (period === 'fy2627') return getFinancialYearFromDate(kp.date) === '2026-27';
    if (period === 'fy2526') return getFinancialYearFromDate(kp.date) === '2025-26';
    if (period === 'fy2425') return getFinancialYearFromDate(kp.date) === '2024-25';
    return true;
  });

  const filteredPurchases = purchasesExpenses.filter((pe) => {
    if (period === 'today') return pe.date.startsWith(todayStr);
    if (period === 'month') return pe.date.startsWith(currentMonthStr);
    if (period === 'fy2627') return getFinancialYearFromDate(pe.date) === '2026-27';
    if (period === 'fy2526') return getFinancialYearFromDate(pe.date) === '2025-26';
    if (period === 'fy2425') return getFinancialYearFromDate(pe.date) === '2024-25';
    return true;
  });

  // Stats
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCashSales = filteredSales.reduce((sum, s) => sum + s.cashReceived, 0);
  const totalOnlineSales = filteredSales.reduce((sum, s) => sum + s.onlineReceived, 0);
  const totalPendingCreated = filteredSales.reduce((sum, s) => sum + s.pendingAmount, 0);

  const totalKhataCollected = filteredKhata.reduce((sum, kp) => sum + kp.amount, 0);

  const totalGheeSoldKg = getGheeSoldFromSales(filteredSales, products);

  const loyaltyDiscountGiven = filteredSales.reduce((sum, s) => sum + s.discountAmount, 0);

  // Outflow
  const totalMaterialPurchases = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCreamProcuredKg = filteredPurchases
    .filter((p) => p.category === 'raw_cream')
    .reduce((sum, p) => sum + (p.quantityKg || 0), 0);
  const totalWholesaleGheeProcuredKg = filteredPurchases
    .filter((p) => p.category === 'wholesale_ghee')
    .reduce((sum, p) => sum + (p.quantityKg || 0), 0);

  // Estimated gross profit
  const estimatedGrossProfit = totalRevenue - totalMaterialPurchases;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header with Prominent PDF / WhatsApp Export Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-stone-900 tracking-tight">
              Business Accounts & Multi-Year Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
              3 Financial Years
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time shop accounts, ghee volume tally, and official PDF/WhatsApp statements for Day, Month & Year.
          </p>
        </div>

        {/* Primary Export Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setExportModalConfig({
                isOpen: true,
                mode: 'day',
                date: todayStr,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Export Day PDF</span>
          </button>

          <button
            onClick={() =>
              setExportModalConfig({
                isOpen: true,
                mode: 'range',
                date: todayStr,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title="Export Custom Date Range (1 to 10 Oct etc.) Report"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Date Range PDF (कस्टम अवधि)</span>
          </button>

          <button
            onClick={() =>
              setExportModalConfig({
                isOpen: true,
                mode: 'month',
                date: todayStr,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Month Statement (31 Days)</span>
          </button>

          <button
            onClick={() =>
              setExportModalConfig({
                isOpen: true,
                mode: 'year',
                date: todayStr,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Annual FY Report</span>
          </button>
        </div>
      </div>

      {/* 3-Year Time Horizon Bar */}
      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-600" />
          Select Ledger View Period:
        </span>

        <div className="flex flex-wrap bg-white p-1 rounded-xl border border-stone-200 text-xs font-medium shadow-2xs">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'today'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Today (आज)
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'month'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            This Month (इस माह)
          </button>
          <button
            onClick={() => setPeriod('fy2627')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'fy2627'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            FY 2026-27 (Current)
          </button>
          <button
            onClick={() => setPeriod('fy2526')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'fy2526'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            FY 2025-26
          </button>
          <button
            onClick={() => setPeriod('fy2425')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'fy2425'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            FY 2024-25
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'all'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All 3 Years
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-amber-700 to-amber-800 text-white rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-200 text-xs">
            <span>Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-amber-100/80">
            From {filteredSales.length} bills generated
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-800 to-yellow-900 text-white rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-200 text-xs">
            <span>Pure Desi Ghee Sold</span>
            <Droplet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {totalGheeSoldKg.toFixed(3)} <span className="text-lg font-normal">kg</span>
          </div>
          <p className="text-[11px] text-amber-100/80">
            Retail volume delivered to customers
          </p>
        </div>

        <div
          className={`rounded-2xl p-4 text-white shadow-sm space-y-1 ${
            estimatedGrossProfit >= 0
              ? 'bg-gradient-to-br from-emerald-700 to-teal-800'
              : 'bg-gradient-to-br from-rose-700 to-rose-900'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-200 text-xs">
            <span>Net Operating Margin (लाभ)</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(estimatedGrossProfit)}
          </div>
          <p className="text-[11px] text-emerald-100/80">
            Revenue minus cream & wholesale material costs
          </p>
        </div>
      </div>

      {/* Cash vs Online Split Detailed Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <span>Payment Mode Distribution (रोकड़ व बैंक विभाजन)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Cash */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-700" />
                Cash Collected (गल्ले में)
              </span>
              <span className="font-mono text-sm">{formatCurrency(totalCashSales)}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Direct physical currency received at the shop counter.
            </p>
          </div>

          {/* Online */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-700" />
                Online / UPI (बैंक में)
              </span>
              <span className="font-mono text-sm">{formatCurrency(totalOnlineSales)}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Directly credited to Bank account via QR/UPI/GPay.
            </p>
          </div>

          {/* Pending Udhaar */}
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-rose-900">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Pending Credit (उधार दिया)
              </span>
              <span className="font-mono text-sm">{formatCurrency(totalPendingCreated)}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Pending amount added to customer khata in this period.
            </p>
          </div>
        </div>
      </div>

      {/* Material Processing & Wholesale Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Raw material & wholesale */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-700" />
            <span>Procurement & Processing (कच्चा माल व थोक)</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
              <div>
                <span className="font-semibold text-stone-800 block">Raw Cream Intake (मलाई)</span>
                <span className="text-[11px] text-stone-500">Processed into fresh home ghee</span>
              </div>
              <span className="font-mono font-bold text-stone-900 text-sm">
                {totalCreamProcuredKg.toFixed(3)} kg
              </span>
            </div>

            <div className="flex justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
              <div>
                <span className="font-semibold text-stone-800 block">Wholesale Ghee Tins (थोक घी)</span>
                <span className="text-[11px] text-stone-500">Purchased from Mandi for retail</span>
              </div>
              <span className="font-mono font-bold text-stone-900 text-sm">
                {totalWholesaleGheeProcuredKg.toFixed(3)} kg
              </span>
            </div>

            <div className="flex justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-950 font-bold">
              <span>Total Material & Cost Outflow:</span>
              <span className="font-mono text-sm">{formatCurrency(totalMaterialPurchases)}</span>
            </div>
          </div>
        </div>

        {/* Loyalty scheme impact */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-700" />
            <span>Customer Loyalty Scheme Impact</span>
          </h3>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] text-stone-600 block">Total 5% Discounts Given to Repeat Buyers:</span>
              <span className="text-base font-black font-mono text-amber-900 block mt-0.5">
                {formatCurrency(loyaltyDiscountGiven)}
              </span>
              <span className="text-[10px] text-amber-700">Rewarded to loyal recurring customers</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 space-y-1">
              <span className="font-semibold text-stone-800 block">Active Scheme Members:</span>
              <p className="text-[11px]">
                {customers.filter((c) => c.loyaltyExpiresAt && new Date(c.loyaltyExpiresAt) > new Date()).length} customers currently have valid 5% discount windows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Export Modal */}
      {exportModalConfig.isOpen && (
        <ReportExportModal
          isOpen={exportModalConfig.isOpen}
          onClose={() => setExportModalConfig((prev) => ({ ...prev, isOpen: false }))}
          settings={settings}
          sales={sales}
          khataPayments={khataPayments}
          purchasesExpenses={purchasesExpenses}
          cashDrawer={cashDrawer}
          customers={customers}
          products={products}
          initialMode={exportModalConfig.mode}
          initialDate={exportModalConfig.date}
        />
      )}
    </div>
  );
};
