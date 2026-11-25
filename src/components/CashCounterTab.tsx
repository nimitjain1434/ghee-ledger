import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  MinusCircle,
  Coins,
  History,
  Calendar,
  Save,
  RotateCcw,
  Printer,
  FileText,
  CalendarRange,
} from 'lucide-react';
import {
  BusinessSettings,
  CashDrawerEntry,
  Customer,
  DenominationCount,
  KhataPayment,
  ProductItem,
  PurchaseExpense,
  Sale,
} from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { ReportExportModal } from './ReportExportModal';

interface CashCounterTabProps {
  settings?: BusinessSettings;
  sales: Sale[];
  khataPayments: KhataPayment[];
  purchasesExpenses: PurchaseExpense[];
  cashDrawer: Record<string, CashDrawerEntry>;
  denominations: Record<string, DenominationCount>;
  customers: Customer[];
  products?: ProductItem[];
  onUpdateDrawer: (date: string, entry: CashDrawerEntry) => void;
  onUpdateDenominations: (date: string, counts: DenominationCount) => void;
  onOpenNewSale: () => void;
}

export const CashCounterTab: React.FC<CashCounterTabProps> = ({
  settings,
  sales,
  khataPayments,
  purchasesExpenses,
  cashDrawer,
  denominations,
  customers,
  products = [],
  onUpdateDrawer,
  onUpdateDenominations,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalMode, setExportModalMode] = useState<'day' | 'range' | 'month' | 'year'>('day');

  // Drawer record for selected date
  const currentDrawer: CashDrawerEntry = cashDrawer[selectedDate] || {
    id: `drawer_${selectedDate}`,
    date: selectedDate,
    openingCash: 0,
    addedCash: 0,
    withdrawnCash: 0,
  };

  const currentDenominations: DenominationCount = denominations[selectedDate] || {
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0,
  };

  const [localDenoms, setLocalDenoms] = useState<DenominationCount>(currentDenominations);
  const [editingOpening, setEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState(currentDrawer.openingCash.toString());
  const [editingBankOpening, setEditingBankOpening] = useState(false);
  const [openingBankInput, setOpeningBankInput] = useState((currentDrawer.openingBank ?? 0).toString());
  const [showAdjustModal, setShowAdjustModal] = useState<'add' | 'withdraw' | 'add_bank' | 'withdraw_bank' | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Synchronize local states when date or stored values change
  useEffect(() => {
    const denomsForDate = denominations[selectedDate] || {
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      coins: 0,
    };
    setLocalDenoms(denomsForDate);
    setOpeningInput((cashDrawer[selectedDate]?.openingCash ?? 0).toString());
    setOpeningBankInput((cashDrawer[selectedDate]?.openingBank ?? 0).toString());
  }, [selectedDate, denominations, cashDrawer]);

  // Filter transactions by selected date
  const dateSales = sales.filter((s) => s.date.startsWith(selectedDate));
  const dateKhataPayments = khataPayments.filter((kp) => kp.date.startsWith(selectedDate));
  const datePurchases = purchasesExpenses.filter((pe) => pe.date.startsWith(selectedDate));

  // --- CASH COUNTER CALCULATIONS ---
  const salesCashIn = dateSales.reduce((sum, s) => sum + (s.cashReceived || 0), 0);
  const khataCashIn = dateKhataPayments
    .filter((kp) => kp.paymentMode === 'cash')
    .reduce((sum, kp) => sum + kp.amount, 0);

  const totalCashIn = salesCashIn + khataCashIn + (currentDrawer.addedCash || 0);

  const purchasesCashOut = datePurchases
    .filter((pe) => pe.paymentMode === 'cash')
    .reduce((sum, pe) => sum + pe.totalAmount, 0);

  const totalCashOut = purchasesCashOut + (currentDrawer.withdrawnCash || 0);

  const expectedCashInDrawer = currentDrawer.openingCash + totalCashIn - totalCashOut;

  // --- PHYSICAL DENOMINATION COUNT ---
  const physicalCashTotal =
    (localDenoms[500] || 0) * 500 +
    (localDenoms[200] || 0) * 200 +
    (localDenoms[100] || 0) * 100 +
    (localDenoms[50] || 0) * 50 +
    (localDenoms[20] || 0) * 20 +
    (localDenoms[10] || 0) * 10 +
    (localDenoms.coins || 0);

  const cashDifference = physicalCashTotal - expectedCashInDrawer;

  // --- ONLINE / BANK ACCOUNT CALCULATIONS ---
  const salesOnlineIn = dateSales.reduce((sum, s) => sum + (s.onlineReceived || 0), 0);
  const khataOnlineIn = dateKhataPayments
    .filter((kp) => kp.paymentMode === 'online')
    .reduce((sum, kp) => sum + kp.amount, 0);
  const bankAdded = currentDrawer.addedBank || 0;

  const totalOnlineIn = salesOnlineIn + khataOnlineIn + bankAdded;

  const purchasesOnlineOut = datePurchases
    .filter((pe) => pe.paymentMode === 'online')
    .reduce((sum, pe) => sum + pe.totalAmount, 0);
  const bankWithdrawn = currentDrawer.withdrawnBank || 0;

  const totalOnlineOut = purchasesOnlineOut + bankWithdrawn;

  const netOnlineInBank = (currentDrawer.openingBank || 0) + totalOnlineIn - totalOnlineOut;

  // Credit (Udhaar) given today
  const creditGivenToday = dateSales.reduce((sum, s) => sum + (s.pendingAmount || 0), 0);

  // Handlers
  const handleSaveOpening = () => {
    const val = Math.max(0, parseFloat(openingInput) || 0);
    const updated: CashDrawerEntry = {
      ...currentDrawer,
      openingCash: val,
    };
    onUpdateDrawer(selectedDate, updated);
    setEditingOpening(false);
  };

  const handleSaveBankOpening = () => {
    const val = Math.max(0, parseFloat(openingBankInput) || 0);
    const updated: CashDrawerEntry = {
      ...currentDrawer,
      openingBank: val,
    };
    onUpdateDrawer(selectedDate, updated);
    setEditingBankOpening(false);
  };

  const handleAdjustDrawer = () => {
    const amount = Math.max(0, parseFloat(adjustAmount) || 0);
    if (amount <= 0) return;

    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let updated: CashDrawerEntry;
    if (showAdjustModal === 'add') {
      const reasonText = adjustReason.trim() || 'Cash added to drawer';
      const newMovement = {
        id: `am_${Date.now()}`,
        time: nowTime,
        amount,
        reason: reasonText,
        type: 'add' as const,
        channel: 'cash' as const,
      };
      updated = {
        ...currentDrawer,
        addedCash: (currentDrawer.addedCash || 0) + amount,
        notes: `${currentDrawer.notes || ''}; Added ₹${amount}: ${reasonText}`,
        additionsList: [...(currentDrawer.additionsList || []), newMovement],
      };
    } else if (showAdjustModal === 'withdraw') {
      const reasonText = adjustReason.trim() || 'Owner cash withdrawal';
      const newMovement = {
        id: `wm_${Date.now()}`,
        time: nowTime,
        amount,
        reason: reasonText,
        type: 'withdraw' as const,
        channel: 'cash' as const,
      };
      updated = {
        ...currentDrawer,
        withdrawnCash: (currentDrawer.withdrawnCash || 0) + amount,
        notes: `${currentDrawer.notes || ''}; Withdrawn ₹${amount}: ${reasonText}`,
        withdrawalsList: [...(currentDrawer.withdrawalsList || []), newMovement],
      };
    } else if (showAdjustModal === 'add_bank') {
      const reasonText = adjustReason.trim() || 'Money added / deposited to bank account';
      const newMovement = {
        id: `bam_${Date.now()}`,
        time: nowTime,
        amount,
        reason: reasonText,
        type: 'add' as const,
        channel: 'bank' as const,
      };
      updated = {
        ...currentDrawer,
        addedBank: (currentDrawer.addedBank || 0) + amount,
        notes: `${currentDrawer.notes || ''}; Bank Added ₹${amount}: ${reasonText}`,
        bankAdditionsList: [...(currentDrawer.bankAdditionsList || []), newMovement],
      };
    } else {
      // withdraw_bank
      const reasonText = adjustReason.trim() || 'Money withdrawn from bank account';
      const newMovement = {
        id: `bwm_${Date.now()}`,
        time: nowTime,
        amount,
        reason: reasonText,
        type: 'withdraw' as const,
        channel: 'bank' as const,
      };
      updated = {
        ...currentDrawer,
        withdrawnBank: (currentDrawer.withdrawnBank || 0) + amount,
        notes: `${currentDrawer.notes || ''}; Bank Withdrawn ₹${amount}: ${reasonText}`,
        bankWithdrawalsList: [...(currentDrawer.bankWithdrawalsList || []), newMovement],
      };
    }

    onUpdateDrawer(selectedDate, updated);
    setShowAdjustModal(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const handleDenomChange = (key: keyof DenominationCount, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = {
      ...localDenoms,
      [key]: num,
    };
    setLocalDenoms(updated);
    onUpdateDenominations(selectedDate, updated);
  };

  const handleResetDenoms = () => {
    const empty: DenominationCount = {
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      coins: 0,
    };
    setLocalDenoms(empty);
    onUpdateDenominations(selectedDate, empty);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Date Header & Quick Selector */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-black text-stone-900 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Cash Counter &amp; Bank Reconciliation</span>
            <span className="text-xs font-normal text-stone-500 hidden sm:inline">
              (शॉप गल्ला व बैंक हिसाब)
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Verify actual cash in drawer vs computer books, and track online bank deposits.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {/* Date Toggle + Picker Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-medium flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  setSelectedDate(todayStr);
                  setLocalDenoms(denominations[todayStr] || currentDenominations);
                }}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded-lg transition whitespace-nowrap ${
                  selectedDate === todayStr ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Today (आज)
              </button>
              <button
                onClick={() => {
                  const y = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  setSelectedDate(y);
                  setLocalDenoms(denominations[y] || currentDenominations);
                }}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded-lg transition whitespace-nowrap ${
                  selectedDate !== todayStr ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Custom Date
              </button>
            </div>

            <div className="relative flex items-center flex-1 sm:flex-initial min-w-[130px]">
              <Calendar className="w-4 h-4 absolute left-2.5 text-stone-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setLocalDenoms(denominations[e.target.value] || currentDenominations);
                }}
                className="w-full pl-8 pr-2 py-1.5 sm:py-1 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
              />
            </div>
          </div>

          {/* PDF / Photo Export Buttons Row */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              onClick={() => {
                setExportModalMode('day');
                setShowExportModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
              title="Export Day Audit Statement PDF, Photo or WhatsApp"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Print Day PDF</span>
            </button>

            <button
              onClick={() => {
                setExportModalMode('range');
                setShowExportModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
              title="Export Custom Date Range (1 to 10 Oct etc.) Statement PDF, Photo or WhatsApp"
            >
              <CalendarRange className="w-3.5 h-3.5 shrink-0" />
              <span>Date Range PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Big Hero Summary Cards: Cash in Hand vs Bank / Online */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: CASH COUNTER (गल्ला) */}
        <div className="bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-900/80 border border-amber-600/40 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-200 block">
                    Cash in Counter (गल्ला रोकड़)
                  </span>
                  <span className="text-[11px] text-amber-100/80">Physical Money In Drawer</span>
                </div>
              </div>

              {/* Status Pill */}
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/90 border border-amber-500/50 font-semibold text-amber-200">
                Book Balance
              </span>
            </div>

            <div className="mt-4 mb-2">
              <span className="text-xs text-amber-200 block">Expected in Drawer Right Now:</span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                {formatCurrency(expectedCashInDrawer)}
              </div>
            </div>
          </div>

          {/* Breakdown Mini List */}
          <div className="mt-3 pt-3 border-t border-amber-600/30 text-xs space-y-1.5 text-amber-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span>Morning Opening Cash (सुबह का गल्ला):</span>
                {editingOpening ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={openingInput}
                      onChange={(e) => setOpeningInput(e.target.value)}
                      className="w-20 px-1 py-0.5 text-xs text-stone-900 rounded bg-white"
                    />
                    <button
                      onClick={handleSaveOpening}
                      className="px-1.5 py-0.5 bg-amber-500 text-stone-900 font-bold rounded text-[10px]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOpeningInput(currentDrawer.openingCash.toString());
                      setEditingOpening(true);
                    }}
                    className="text-[11px] underline text-amber-300 hover:text-white"
                  >
                    Edit
                  </button>
                )}
              </div>
              <span className="font-mono font-semibold">{formatCurrency(currentDrawer.openingCash)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-emerald-300">(+) Today Cash In (बिक्री + वसूली):</span>
              <span className="font-mono font-semibold text-emerald-300">
                + {formatCurrency(totalCashIn)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-rose-300">(-) Today Cash Out (मलाई/घी खरीद + खर्चे):</span>
              <span className="font-mono font-semibold text-rose-300">
                - {formatCurrency(totalCashOut)}
              </span>
            </div>
          </div>

          {/* Actions for drawer */}
          <div className="mt-4 pt-3 border-t border-amber-600/30 flex gap-2">
            <button
              onClick={() => setShowAdjustModal('add')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-600/60 hover:bg-amber-600 text-amber-100 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-amber-500/40 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Cash (डाला)</span>
            </button>
            <button
              onClick={() => setShowAdjustModal('withdraw')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-600/60 hover:bg-amber-600 text-amber-100 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-amber-500/40 transition"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Withdraw (घर ले गए)</span>
            </button>
          </div>
        </div>

        {/* Card 2: ONLINE / BANK ACCOUNT (बैंक खाता) */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-200 block">
                    Online / Bank (बैंक खाता / UPI)
                  </span>
                  <span className="text-[11px] text-indigo-100/80">UPI / QR / GPay / NetBanking</span>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/50 font-semibold text-indigo-200">
                Direct in Bank
              </span>
            </div>

            <div className="mt-4 mb-2">
              <span className="text-xs text-indigo-200 block">Expected in Bank Right Now:</span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                {formatCurrency(netOnlineInBank)}
              </div>
            </div>
          </div>

          {/* Breakdown Mini List */}
          <div className="mt-3 pt-3 border-t border-indigo-600/30 text-xs space-y-1.5 text-indigo-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span>Morning Bank Balance (बैंक ओपनिंग):</span>
                {editingBankOpening ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={openingBankInput}
                      onChange={(e) => setOpeningBankInput(e.target.value)}
                      className="w-20 px-1 py-0.5 text-xs text-stone-900 rounded bg-white font-mono font-bold"
                    />
                    <button
                      onClick={handleSaveBankOpening}
                      className="px-1.5 py-0.5 bg-indigo-400 text-stone-950 font-bold rounded text-[10px] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOpeningBankInput((currentDrawer.openingBank ?? 0).toString());
                      setEditingBankOpening(true);
                    }}
                    className="text-[11px] underline text-indigo-300 hover:text-white cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>
              <span className="font-mono font-semibold">{formatCurrency(currentDrawer.openingBank || 0)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-emerald-300">(+) Today Online In (UPI बिक्री + वसूली + जमा):</span>
              <span className="font-mono font-semibold text-emerald-300">
                + {formatCurrency(totalOnlineIn)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-rose-300">(-) Today Online Out (खरीद + बैंक निकासी):</span>
              <span className="font-mono font-semibold text-rose-300">
                - {formatCurrency(totalOnlineOut)}
              </span>
            </div>
          </div>

          {/* Actions for bank account (Add / Withdraw) */}
          <div className="mt-4 pt-3 border-t border-indigo-600/30 flex gap-2">
            <button
              id="btn-add-bank"
              onClick={() => setShowAdjustModal('add_bank')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-indigo-100 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-indigo-500/40 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Money (बैंक में डाला)</span>
            </button>
            <button
              id="btn-withdraw-bank"
              onClick={() => setShowAdjustModal('withdraw_bank')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-indigo-100 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-indigo-500/40 transition cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Withdraw (बैंक से निकाला)</span>
            </button>
          </div>
        </div>
      </div>

      {/* PHYSICAL NOTE COUNTER (शॉप गल्ला नोट गिनती व मिलान) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Physical Cash Tally Calculator (गल्ला नोट गिनती)
              </h2>
              <p className="text-xs text-stone-500">
                Count notes in your cash drawer to verify exact match with computer accounts.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetDenoms}
            className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Count
          </button>
        </div>

        {/* Note inputs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {[
            { label: '₹500', key: 500 as const, bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
            { label: '₹200', key: 200 as const, bg: 'bg-amber-50 text-amber-900 border-amber-200' },
            { label: '₹100', key: 100 as const, bg: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
            { label: '₹50', key: 50 as const, bg: 'bg-cyan-50 text-cyan-900 border-cyan-200' },
            { label: '₹20', key: 20 as const, bg: 'bg-orange-50 text-orange-900 border-orange-200' },
            { label: '₹10', key: 10 as const, bg: 'bg-stone-100 text-stone-900 border-stone-300' },
          ].map((denom) => (
            <div
              key={denom.key}
              className={`p-2.5 rounded-xl border ${denom.bg} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-xs font-black">
                <span>{denom.label}</span>
                <span className="font-mono text-[10px] opacity-75">
                  = ₹{((localDenoms[denom.key] || 0) * denom.key).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-stone-400">×</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localDenoms[denom.key] || ''}
                  onChange={(e) => handleDenomChange(denom.key, e.target.value)}
                  className="w-full py-1 px-1.5 text-center text-sm font-bold bg-white rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          ))}

          {/* Coins / Change */}
          <div className="p-2.5 rounded-xl border bg-stone-100 border-stone-300 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-black text-stone-800">
              <span>Coins (सिक्के)</span>
              <span className="font-mono text-[10px] opacity-75">
                = ₹{(localDenoms.coins || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-stone-400">₹</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={localDenoms.coins || ''}
                onChange={(e) => handleDenomChange('coins', e.target.value)}
                className="w-full py-1 px-1.5 text-center text-sm font-bold bg-white rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Tally & Match Comparison Result Bar */}
        <div className="pt-2">
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              cashDifference === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : cashDifference > 0
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {cashDifference === 0 ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              ) : cashDifference > 0 ? (
                <ArrowUpRight className="w-7 h-7 text-blue-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black">
                    {cashDifference === 0
                      ? 'Gallah 100% Matched! (गल्ला बिलकुल सही है)'
                      : cashDifference > 0
                      ? `Surplus Cash: +${formatCurrency(cashDifference)} extra in drawer`
                      : `Cash Shortage: ${formatCurrency(Math.abs(cashDifference))} missing in drawer`}
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Physical Count in Hand: <strong>{formatCurrency(physicalCashTotal)}</strong> •
                  Expected as per books: <strong>{formatCurrency(expectedCashInDrawer)}</strong>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase font-bold text-stone-500 block">
                Difference (अंतर)
              </span>
              <span
                className={`text-xl font-black font-mono ${
                  cashDifference === 0
                    ? 'text-emerald-700'
                    : cashDifference > 0
                    ? 'text-blue-700'
                    : 'text-rose-700'
                }`}
              >
                {cashDifference > 0 ? `+${formatCurrency(cashDifference)}` : formatCurrency(cashDifference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED LEDGER OF CASH & ONLINE MOVEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Inflow & Outflow Transactions */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-700" />
              Cash Drawer Entries ({dateSales.filter((s) => s.cashReceived > 0).length + datePurchases.filter((p) => p.paymentMode === 'cash').length} transactions)
            </h3>
            <span className="text-xs font-mono font-bold text-amber-900">
              Net: {formatCurrency(totalCashIn - totalCashOut)}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {/* Opening cash item */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <div>
                <span className="font-semibold text-stone-800 block">Morning Opening Cash</span>
                <span className="text-[11px] text-stone-400">Cash in drawer at start of day</span>
              </div>
              <span className="font-mono font-bold text-stone-900">
                {formatCurrency(currentDrawer.openingCash)}
              </span>
            </div>

            {/* Sales Cash In */}
            {dateSales
              .filter((s) => s.cashReceived > 0)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-stone-900">{s.customerName}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {s.invoiceNo} • {formatDateTime(s.date)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(s.cashReceived)}
                  </span>
                </div>
              ))}

            {/* Khata Cash Collections */}
            {dateKhataPayments
              .filter((kp) => kp.paymentMode === 'cash')
              .map((kp) => (
                <div
                  key={kp.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200"
                >
                  <div>
                    <span className="font-semibold text-stone-900">
                      {kp.type === 'advance_deposit' ? 'Advance Jama:' : 'Khata Payment:'} {kp.customerName}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {kp.advanceAdded && kp.advanceAdded > 0
                        ? `Extra / Advance saved: ₹${kp.advanceAdded}${kp.udhaarCleared ? ` • Udhaar cleared: ₹${kp.udhaarCleared}` : ''}`
                        : 'Cash received towards credit'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(kp.amount)}
                  </span>
                </div>
              ))}

            {/* Purchases & Expenses Cash Out */}
            {datePurchases
              .filter((p) => p.paymentMode === 'cash')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-semibold text-stone-900">{p.title}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Paid to {p.supplierOrPayee || 'Supplier'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    -{formatCurrency(p.totalAmount)}
                  </span>
                </div>
              ))}

            {/* Cash Added */}
            {currentDrawer.additionsList && currentDrawer.additionsList.length > 0 ? (
              currentDrawer.additionsList.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 border border-emerald-200">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-stone-900">Cash Added ({a.time})</span>
                    </div>
                    <span className="text-[11px] text-stone-600 block">{a.reason}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(a.amount)}
                  </span>
                </div>
              ))
            ) : currentDrawer.addedCash > 0 ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 border border-emerald-200">
                <div>
                  <span className="font-semibold text-stone-900">Cash Added to Drawer</span>
                  <span className="text-[11px] text-stone-500 block">{currentDrawer.notes || ''}</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatCurrency(currentDrawer.addedCash)}
                </span>
              </div>
            ) : null}

            {/* Cash Withdrawn with Reason */}
            {currentDrawer.withdrawalsList && currentDrawer.withdrawalsList.length > 0 ? (
              currentDrawer.withdrawalsList.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/80 border border-rose-200">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-semibold text-stone-900">Cash Withdrawn ({w.time})</span>
                    </div>
                    <span className="text-[11px] text-rose-800 font-medium block">
                      Reason: {w.reason}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    -{formatCurrency(w.amount)}
                  </span>
                </div>
              ))
            ) : currentDrawer.withdrawnCash > 0 ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/80 border border-rose-200">
                <div>
                  <span className="font-semibold text-stone-900">Cash Withdrawn / Taken Home</span>
                  <span className="text-[11px] text-stone-500 block">{currentDrawer.notes || ''}</span>
                </div>
                <span className="font-mono font-bold text-rose-700">
                  -{formatCurrency(currentDrawer.withdrawnCash)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Online / Bank Account Entries */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-700" />
              Online / Bank Entries (
              {dateSales.filter((s) => s.onlineReceived > 0).length +
                dateKhataPayments.filter((kp) => kp.paymentMode === 'online').length +
                datePurchases.filter((p) => p.paymentMode === 'online').length +
                (currentDrawer.bankAdditionsList?.length || (currentDrawer.addedBank ? 1 : 0)) +
                (currentDrawer.bankWithdrawalsList?.length || (currentDrawer.withdrawnBank ? 1 : 0))} transactions)
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-900">
              Bank Total: {formatCurrency(netOnlineInBank)}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {/* Opening Bank Balance if set */}
            {(currentDrawer.openingBank || 0) > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/40 border border-indigo-100">
                <div>
                  <span className="font-semibold text-stone-900">Morning Opening Bank Balance</span>
                  <span className="text-[11px] text-stone-500 block">Bank balance brought forward</span>
                </div>
                <span className="font-mono font-bold text-indigo-700">
                  {formatCurrency(currentDrawer.openingBank || 0)}
                </span>
              </div>
            )}

            {dateSales
              .filter((s) => s.onlineReceived > 0)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-stone-900">{s.customerName}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {s.invoiceNo} • Online UPI • {formatDateTime(s.date)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">
                    +{formatCurrency(s.onlineReceived)}
                  </span>
                </div>
              ))}

            {dateKhataPayments
              .filter((kp) => kp.paymentMode === 'online')
              .map((kp) => (
                <div
                  key={kp.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-200"
                >
                  <div>
                    <span className="font-semibold text-stone-900">
                      {kp.type === 'advance_deposit' ? 'Online Advance Jama:' : 'Online Khata Payment:'} {kp.customerName}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {kp.advanceAdded && kp.advanceAdded > 0
                        ? `Extra / Advance saved: ₹${kp.advanceAdded}${kp.udhaarCleared ? ` • Udhaar cleared: ₹${kp.udhaarCleared}` : ''}`
                        : 'UPI Bank transfer'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">
                    +{formatCurrency(kp.amount)}
                  </span>
                </div>
              ))}

            {/* Bank Additions (Detailed movements or single total) */}
            {currentDrawer.bankAdditionsList && currentDrawer.bankAdditionsList.length > 0 ? (
              currentDrawer.bankAdditionsList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-stone-900">Added to Bank (जमा)</span>
                    </div>
                    <span className="text-[11px] text-stone-600">
                      {m.reason} {m.time ? `• ${m.time}` : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(m.amount)}
                  </span>
                </div>
              ))
            ) : (currentDrawer.addedBank || 0) > 0 ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div>
                  <span className="font-semibold text-stone-900">Money Added to Bank</span>
                  <span className="text-[11px] text-stone-500 block">Deposited into bank account</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatCurrency(currentDrawer.addedBank)}
                </span>
              </div>
            ) : null}

            {datePurchases
              .filter((p) => p.paymentMode === 'online')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-semibold text-stone-900">{p.title}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Bank NEFT / Online to {p.supplierOrPayee}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    -{formatCurrency(p.totalAmount)}
                  </span>
                </div>
              ))}

            {/* Bank Withdrawals (Detailed movements or single total) */}
            {currentDrawer.bankWithdrawalsList && currentDrawer.bankWithdrawalsList.length > 0 ? (
              currentDrawer.bankWithdrawalsList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-200"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-semibold text-stone-900">Withdrawn from Bank (निकासी)</span>
                    </div>
                    <span className="text-[11px] text-stone-600">
                      {m.reason} {m.time ? `• ${m.time}` : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    -{formatCurrency(m.amount)}
                  </span>
                </div>
              ))
            ) : (currentDrawer.withdrawnBank || 0) > 0 ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-200">
                <div>
                  <span className="font-semibold text-stone-900">Withdrawn from Bank</span>
                  <span className="text-[11px] text-stone-500 block">ATM / Bank transfer</span>
                </div>
                <span className="font-mono font-bold text-rose-700">
                  -{formatCurrency(currentDrawer.withdrawnBank)}
                </span>
              </div>
            ) : null}

            {dateSales.filter((s) => s.onlineReceived > 0).length === 0 &&
              dateKhataPayments.filter((kp) => kp.paymentMode === 'online').length === 0 &&
              datePurchases.filter((p) => p.paymentMode === 'online').length === 0 &&
              (currentDrawer.addedBank || 0) === 0 &&
              (currentDrawer.withdrawnBank || 0) === 0 &&
              (currentDrawer.openingBank || 0) === 0 && (
                <div className="py-8 text-center text-stone-400">
                  No online transactions recorded for this date.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Adjust Drawer Cash / Online Bank Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  showAdjustModal.includes('bank')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {showAdjustModal.includes('bank') ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-base font-bold text-stone-900">
                {showAdjustModal === 'add'
                  ? 'Add Cash to Drawer (गल्ले में नकद डाला)'
                  : showAdjustModal === 'withdraw'
                  ? 'Withdraw Cash (गल्ले से नकद निकाला)'
                  : showAdjustModal === 'add_bank'
                  ? 'Add Money to Bank (बैंक में जमा/डाला)'
                  : 'Withdraw from Bank (बैंक से निकाला)'}
              </h3>
            </div>

            <p className="text-xs text-stone-500 mt-1">
              {showAdjustModal === 'add'
                ? 'Enter amount added to physical cash drawer from home or bank.'
                : showAdjustModal === 'withdraw'
                ? 'Enter physical cash taken home by owner or deposited elsewhere.'
                : showAdjustModal === 'add_bank'
                ? 'Enter amount deposited or transferred into the shop online bank account.'
                : 'Enter amount withdrawn from bank account (ATM, personal transfer, savings).'}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Amount ₹</label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  placeholder="e.g. 5000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-stone-300 text-base font-bold font-mono focus:ring-2 ${
                    showAdjustModal.includes('bank')
                      ? 'focus:ring-indigo-500 focus:border-indigo-500'
                      : 'focus:ring-amber-500 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder={
                    showAdjustModal === 'add'
                      ? 'e.g. Added from home, change money'
                      : showAdjustModal === 'withdraw'
                      ? 'e.g. Cash taken home, personal use'
                      : showAdjustModal === 'add_bank'
                      ? 'e.g. Cash deposited in bank, transfer from savings'
                      : 'e.g. ATM withdrawal, transfer to savings, personal use'
                  }
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 ${
                    showAdjustModal.includes('bank')
                      ? 'focus:ring-indigo-500 focus:border-indigo-500'
                      : 'focus:ring-amber-500 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAdjustModal(null);
                  setAdjustAmount('');
                  setAdjustReason('');
                }}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustDrawer}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  showAdjustModal.includes('bank')
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Export PDF Modal */}
      {showExportModal && (
        <ReportExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          settings={
            settings || {
              shopName: 'Shri Krishna Desi Ghee Bhandar',
              ownerName: 'Papaji / Owner',
              phone: '9876543210',
              address: 'Mandi Road, Main Market',
              gheeSchemeDiscountPercent: 5,
              schemeMonthsPerKg: 1,
              loyaltySchemeEnabled: true,
            }
          }
          sales={sales}
          khataPayments={khataPayments}
          purchasesExpenses={purchasesExpenses}
          cashDrawer={cashDrawer}
          customers={customers}
          products={products}
          initialMode={exportModalMode}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};
