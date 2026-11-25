import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Calendar,
  Building,
  Coins,
  ArrowUpRight,
  Filter,
  Flame,
  Truck,
  Pencil,
  X,
  AlertCircle,
} from 'lucide-react';
import { PurchaseCategory, PurchaseExpense } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  calculateCreamRateFromGheeYield,
  calculateCreamBaseRateFromFinal,
} from '../utils/creamCalculator';

interface PurchasesExpensesTabProps {
  purchasesExpenses: PurchaseExpense[];
  onAddPurchase: (purchase: PurchaseExpense) => void;
  onUpdatePurchase: (purchase: PurchaseExpense) => void;
  onDeletePurchase: (id: string) => void;
}

export const PurchasesExpensesTab: React.FC<PurchasesExpensesTabProps> = ({
  purchasesExpenses,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | PurchaseCategory>('all');
  const [editingPurchase, setEditingPurchase] = useState<PurchaseExpense | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseExpense | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<PurchaseCategory>('raw_cream');
  const [title, setTitle] = useState('Raw Dairy Cream (कच्ची मलाई)');
  const [supplierOrPayee, setSupplierOrPayee] = useState('');
  const [quantityKg, setQuantityKg] = useState<string>('20');
  const [ratePerKg, setRatePerKg] = useState<string>('335');
  const [customTotal, setCustomTotal] = useState<string>('6700');
  const [testPercentage, setTestPercentage] = useState<string>('51');
  const [baseRate, setBaseRate] = useState<string>('335');
  const [purchaseAdjustTarget, setPurchaseAdjustTarget] = useState<'qty' | 'rate'>('qty');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingPurchase(null);
    setCategory('raw_cream');
    setTitle('Raw Dairy Cream (कच्ची मलाई)');
    setSupplierOrPayee('');
    setTestPercentage('51');
    setBaseRate('335');
    setPurchaseAdjustTarget('qty');
    setQuantityKg('20');
    setRatePerKg('335');
    setCustomTotal('6700');
    setPaymentMode('cash');
    setNotes('');
    setValidationError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: PurchaseExpense) => {
    setEditingPurchase(item);
    setCategory(item.category);
    setTitle(item.title);
    setSupplierOrPayee(item.supplierOrPayee);
    setQuantityKg(item.quantityKg ? item.quantityKg.toString() : '');
    setRatePerKg(item.ratePerKg ? item.ratePerKg.toString() : '');
    setCustomTotal(item.totalAmount.toString());
    setTestPercentage((item.testPercentage || 51).toString());
    setBaseRate((item.baseRate || item.ratePerKg || 335).toString());
    setPurchaseAdjustTarget('qty');
    setPaymentMode(item.paymentMode);
    setNotes(item.notes || '');
    setValidationError(null);
    setShowAddModal(true);
  };

  // Handle category preset changes
  const handleCategorySelect = (cat: PurchaseCategory) => {
    setCategory(cat);
    if (cat === 'raw_cream') {
      setTitle('Raw Dairy Cream (कच्ची मलाई)');
      setTestPercentage('51');
      setBaseRate('335');
      setQuantityKg('20');
      setRatePerKg('335');
      setCustomTotal('6700');
    } else if (cat === 'wholesale_ghee') {
      setTitle('Wholesale Desi Ghee (थोक देसी घी)');
      setQuantityKg('15');
      setRatePerKg('580');
      setCustomTotal('8700');
    } else {
      setTitle('Packaging Jars & Tins');
      setQuantityKg('');
      setRatePerKg('');
      setCustomTotal('500');
    }
  };

  // Cream Realized Ghee-Yield Handlers
  const handleCreamTestChange = (val: string) => {
    setTestPercentage(val);
    const t = parseFloat(val) || 51;
    const b = parseFloat(baseRate) || 335;
    const q = parseFloat(quantityKg) || 0;
    const res = calculateCreamRateFromGheeYield(t, b, q);
    setRatePerKg(res.finalRatePerKg.toString());
    setCustomTotal(res.totalAmount.toString());
  };

  const handleCreamBaseRateChange = (val: string) => {
    setBaseRate(val);
    const t = parseFloat(testPercentage) || 51;
    const b = parseFloat(val) || 0;
    const q = parseFloat(quantityKg) || 0;
    const res = calculateCreamRateFromGheeYield(t, b, q);
    setRatePerKg(res.finalRatePerKg.toString());
    setCustomTotal(res.totalAmount.toString());
  };

  const handleCreamRateChange = (val: string) => {
    setRatePerKg(val);
    const r = parseFloat(val) || 0;
    const t = parseFloat(testPercentage) || 51;
    const q = parseFloat(quantityKg) || 0;
    const recalculatedBase = calculateCreamBaseRateFromFinal(t, r);
    setBaseRate(recalculatedBase.toString());
    const total = Math.round(q * r); // Round whole rupee
    setCustomTotal(total.toString());
  };

  const handleCreamQtyChange = (val: string) => {
    setQuantityKg(val);
    const q = parseFloat(val) || 0;
    const r = parseFloat(ratePerKg) || 0;
    if (q > 0 && r > 0) {
      setCustomTotal(Math.round(q * r).toString()); // Round whole rupee
    }
  };

  const handleCreamAmountChange = (val: string) => {
    setCustomTotal(val);
    const amt = Math.round(parseFloat(val) || 0);
    const q = parseFloat(quantityKg) || 0;
    const r = parseFloat(ratePerKg) || 0;

    if (purchaseAdjustTarget === 'rate') {
      // Bargain: quantity stays fixed, rate is adjusted, back-calculating base rate
      if (q > 0 && amt > 0) {
        const rawRate = amt / q;
        const newRate = Math.round(rawRate * 100) / 100;
        setRatePerKg(newRate.toString());
        const t = parseFloat(testPercentage) || 51;
        const recalculatedBase = calculateCreamBaseRateFromFinal(t, newRate);
        setBaseRate(recalculatedBase.toString());
      }
    } else {
      // Default: rate stays fixed, quantity is adjusted
      if (amt > 0 && r > 0) {
        setQuantityKg((Math.round((amt / r) * 1000) / 1000).toString());
      }
    }
  };

  // Standard Qty & Rate Handlers
  const handleQtyChange = (val: string) => {
    setQuantityKg(val);
    const q = parseFloat(val) || 0;
    const r = parseFloat(ratePerKg) || 0;
    if (q > 0 && r > 0) {
      setCustomTotal(Math.round(q * r).toString());
    }
  };

  const handleRateChange = (val: string) => {
    setRatePerKg(val);
    const q = parseFloat(quantityKg) || 0;
    const r = parseFloat(val) || 0;
    if (q > 0 && r > 0) {
      setCustomTotal(Math.round(q * r).toString());
    }
  };

  const handleAmountChange = (val: string) => {
    setCustomTotal(val);
    const amt = Math.round(parseFloat(val) || 0);
    const q = parseFloat(quantityKg) || 0;
    const r = parseFloat(ratePerKg) || 0;

    if (purchaseAdjustTarget === 'rate') {
      // Bargain: quantity stays fixed, rate is adjusted
      if (q > 0 && amt > 0) {
        const rawRate = amt / q;
        const newRate = Math.round(rawRate * 100) / 100;
        setRatePerKg(newRate.toString());
      }
    } else {
      // Default: rate stays fixed, quantity is adjusted
      if (amt > 0 && r > 0) {
        setQuantityKg((Math.round((amt / r) * 1000) / 1000).toString());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.round(parseFloat(customTotal) || 0);
    if (total <= 0) {
      setValidationError('Please enter a valid amount.');
      return;
    }

    const isCream = category === 'raw_cream';
    const parsedTest = isCream ? (parseFloat(testPercentage) || 51) : undefined;
    const parsedBase = isCream ? (parseFloat(baseRate) || 335) : undefined;
    const parsedQty = parseFloat(quantityKg) || undefined;
    const parsedRate = parseFloat(ratePerKg) || undefined;
    const gheeYieldPercent = isCream && parsedTest ? Math.max(0, parsedTest - 1) : undefined;
    const gheeYieldKg = isCream && parsedTest && parsedQty
      ? Math.round(parsedQty * (gheeYieldPercent! / 100) * 1000) / 1000
      : undefined;

    if (editingPurchase) {
      const updated: PurchaseExpense = {
        ...editingPurchase,
        category,
        title: title.trim() || 'Purchase',
        supplierOrPayee: supplierOrPayee.trim() || 'Supplier',
        quantityKg: parsedQty,
        ratePerKg: parsedRate,
        totalAmount: total,
        paymentMode,
        notes: notes.trim(),
        isCreamPurchase: isCream,
        testPercentage: parsedTest,
        baseRate: parsedBase,
        gheeYieldPercent,
        gheeYieldKg,
      };
      onUpdatePurchase(updated);
    } else {
      const newEntry: PurchaseExpense = {
        id: `pur_${Date.now()}`,
        date: new Date().toISOString(),
        category,
        title: title.trim() || 'Purchase',
        supplierOrPayee: supplierOrPayee.trim() || 'Supplier',
        quantityKg: parsedQty,
        ratePerKg: parsedRate,
        totalAmount: total,
        paymentMode,
        notes: notes.trim(),
        isCreamPurchase: isCream,
        testPercentage: parsedTest,
        baseRate: parsedBase,
        gheeYieldPercent,
        gheeYieldKg,
      };
      onAddPurchase(newEntry);
    }

    setShowAddModal(false);
    setEditingPurchase(null);
    setSupplierOrPayee('');
    setNotes('');
  };

  // Filtered
  const filtered = purchasesExpenses.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  const totalSpent = filtered.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCashSpent = filtered
    .filter((p) => p.paymentMode === 'cash')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalOnlineSpent = filtered
    .filter((p) => p.paymentMode === 'online')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalCreamKg = purchasesExpenses
    .filter((p) => p.category === 'raw_cream')
    .reduce((sum, p) => sum + (p.quantityKg || 0), 0);

  const totalWholesaleGheeKg = purchasesExpenses
    .filter((p) => p.category === 'wholesale_ghee')
    .reduce((sum, p) => sum + (p.quantityKg || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Header KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Total Outflow (कुल खर्च)</span>
          <span className="text-xl font-black font-mono text-stone-900 mt-0.5 block">
            {formatCurrency(totalSpent)}
          </span>
          <span className="text-[10px] text-stone-400">Raw material & shop costs</span>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Cash Paid (गल्ले से दिया)</span>
          <span className="text-xl font-black font-mono text-amber-900 mt-0.5 block">
            {formatCurrency(totalCashSpent)}
          </span>
          <span className="text-[10px] text-amber-700">Deducted from drawer</span>
        </div>

        <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-800 block">Online Paid (बैंक से दिया)</span>
          <span className="text-xl font-black font-mono text-indigo-900 mt-0.5 block">
            {formatCurrency(totalOnlinePaid(filtered))}
          </span>
          <span className="text-[10px] text-indigo-700">UPI / NetBanking payout</span>
        </div>

        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-600 block">Total Procured</span>
          <div className="flex items-center gap-2 mt-0.5 font-mono text-xs font-bold text-stone-900">
            <span>Cream: {totalCreamKg.toFixed(3)}kg</span>
            <span>•</span>
            <span>Ghee: {totalWholesaleGheeKg.toFixed(3)}kg</span>
          </div>
          <span className="text-[10px] text-stone-400">Processed or Repacked</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              categoryFilter === 'all'
                ? 'bg-stone-900 text-white font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Purchases ({purchasesExpenses.length})
          </button>
          <button
            onClick={() => setCategoryFilter('raw_cream')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              categoryFilter === 'raw_cream'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Raw Cream (मलाई)
          </button>
          <button
            onClick={() => setCategoryFilter('wholesale_ghee')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              categoryFilter === 'wholesale_ghee'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Wholesale Ghee (थोक घी)
          </button>
          <button
            onClick={() => setCategoryFilter('shop_expense')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              categoryFilter === 'shop_expense'
                ? 'bg-stone-700 text-white font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Expenses (खर्चे)
          </button>
        </div>

        <button
          id="btn-add-purchase-expense"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Purchase / Expense (खरीद व खर्चा जोड़ें)</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-stone-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    item.category === 'raw_cream'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : item.category === 'wholesale_ghee'
                      ? 'bg-orange-100 text-orange-900 border border-orange-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {item.category === 'raw_cream'
                    ? 'Raw Cream'
                    : item.category === 'wholesale_ghee'
                    ? 'Wholesale Ghee'
                    : 'Shop Expense'}
                </span>
                <h3 className="text-sm font-bold text-stone-900">{item.title}</h3>
              </div>

              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2">
                <span>Supplier/Payee: <strong className="text-stone-700">{item.supplierOrPayee}</strong></span>
                {item.quantityKg && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-semibold text-stone-800">
                      {item.quantityKg.toFixed(3)} kg {item.ratePerKg ? `@ ₹${item.ratePerKg}/kg` : ''}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="text-[11px] text-stone-400">{formatDateTime(item.date)}</span>
              </div>

              {(item.category === 'raw_cream' || item.isCreamPurchase) && (
                <div className="text-[11px] font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block w-fit">
                  Test: {item.testPercentage || 51}% · 51% Base: ₹{item.baseRate || 335}/kg · Yield: {((item.testPercentage || 51) - 1).toFixed(1)}% ({(((item.testPercentage || 51) - 1) * 10).toFixed(0)}g ghee/kg)
                </div>
              )}

              {item.notes && (
                <p className="text-[11px] text-stone-500 italic">&ldquo;{item.notes}&rdquo;</p>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 gap-2 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Amount Paid</span>
                <span className="text-lg font-black font-mono text-rose-700">
                  {formatCurrency(item.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    item.paymentMode === 'cash'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {item.paymentMode === 'cash' ? '💵 Cash from Drawer' : '📱 Online / Bank'}
                </span>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-stone-200 transition cursor-pointer"
                  title="Edit entry"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setPurchaseToDelete(item)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-stone-200 transition cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
            <Package className="w-8 h-8 mx-auto text-stone-300" />
            <p className="mt-2 text-sm text-stone-600 font-medium">No purchase records found</p>
            <p className="text-xs text-stone-400 mt-1">
              Track raw cream, wholesale ghee tins, or packaging expenses here.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {editingPurchase
                    ? 'Edit Purchase / Expense (खरीद व खर्चा संशोधन)'
                    : 'Record Purchase / Expense (खरीद व खर्चा)'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automatically updates Cash Counter drawer or Bank Balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPurchase(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mt-3 bg-rose-50 border border-rose-300 rounded-xl p-2.5 flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5 text-xs">
              {/* Category picker */}
              <div>
                <label className="block font-medium text-stone-700 mb-1">Category (श्रेणी)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { cat: 'raw_cream' as const, label: '🥛 Raw Cream (मलाई)' },
                    { cat: 'wholesale_ghee' as const, label: '🧈 Wholesale Ghee' },
                    { cat: 'shop_expense' as const, label: '📦 Expense / Tins' },
                  ].map((btn) => (
                    <button
                      key={btn.cat}
                      type="button"
                      onClick={() => handleCategorySelect(btn.cat)}
                      className={`p-2 rounded-xl border text-center font-bold transition ${
                        category === btn.cat
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Item Title / Description</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Supplier / Payee Name (विक्रेता / व्यक्ति)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Village Dairy, Mandi Wholesaler"
                  value={supplierOrPayee}
                  onChange={(e) => setSupplierOrPayee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              {/* Cream Realized Ghee-Yield Pricing UI vs Standard Qty & Rate */}
              {category === 'raw_cream' ? (
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <span>🥛 Realized Ghee-Yield Calculator (मलाई खरीद मूल्य)</span>
                    </span>
                    <span className="text-[10px] font-mono bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-bold">
                      Base: 51% Test = 500g Ghee
                    </span>
                  </div>

                  {/* 3 Inputs Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Input 1: Test Percentage */}
                    <div>
                      <label className="block font-bold text-stone-700 text-[11px] mb-0.5">
                        Test % (फैट %) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          placeholder="51.0"
                          value={testPercentage}
                          onChange={(e) => handleCreamTestChange(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-xs font-bold font-mono bg-white focus:border-amber-500"
                        />
                        <span className="absolute right-2 top-1.5 text-stone-400 font-bold text-xs">%</span>
                      </div>
                    </div>

                    {/* Input 2: Base Rate (51% Test) */}
                    <div>
                      <label className="block font-bold text-stone-700 text-[11px] mb-0.5">
                        Base Rate (51%) ₹ *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-stone-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="335"
                          value={baseRate}
                          onChange={(e) => handleCreamBaseRateChange(e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-amber-300 text-xs font-bold font-mono bg-white focus:border-amber-500"
                        />
                      </div>
                      {/* Radio: Adjust Base Rate / Rate */}
                      <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-amber-950 font-semibold select-none">
                        <input
                          type="radio"
                          name="purchase_adjust_target_cream"
                          value="rate"
                          checked={purchaseAdjustTarget === 'rate'}
                          onChange={() => setPurchaseAdjustTarget('rate')}
                          className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>Adjust Base Rate (रेट बदले)</span>
                      </label>
                    </div>

                    {/* Input 3: Quantity */}
                    <div>
                      <label className="block font-bold text-stone-700 text-[11px] mb-0.5">
                        Quantity (kg) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="20.000"
                        value={quantityKg}
                        onChange={(e) => handleCreamQtyChange(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-bold font-mono bg-white focus:border-amber-500"
                      />
                      {/* Radio: Adjust Quantity (Default) */}
                      <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-stone-700 font-semibold select-none">
                        <input
                          type="radio"
                          name="purchase_adjust_target_cream"
                          value="qty"
                          checked={purchaseAdjustTarget !== 'rate'}
                          onChange={() => setPurchaseAdjustTarget('qty')}
                          className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>Adjust Qty (वजन बदले - Default)</span>
                      </label>
                    </div>
                  </div>

                  {/* 2 Outputs Grid: Per-Kg Rate & Total Amount */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block font-bold text-amber-900 text-[11px]">
                          Purchase Rate (₹/kg)
                        </label>
                        <span className="text-[9px] text-amber-700 font-semibold">Editable</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-amber-600 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={ratePerKg}
                          onChange={(e) => handleCreamRateChange(e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-amber-400 font-black font-mono text-amber-950 text-sm bg-amber-100/70 focus:border-amber-600 focus:bg-white"
                          title="Calculated rate for this test %. Typing here back-calculates 51% Base Rate."
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block font-bold text-amber-900 text-[11px]">
                          Total Amount Paid (Round ₹) *
                        </label>
                        <span className="text-[9px] text-stone-400">Auto-calc Qty</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-stone-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="any"
                          required
                          min="1"
                          value={customTotal}
                          onChange={(e) => handleCreamAmountChange(e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg border-2 border-amber-500 font-black font-mono text-stone-900 text-base bg-white focus:border-amber-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Yield Breakdown Helper */}
                  <div className="text-[11px] text-stone-600 bg-white/80 p-2 rounded-lg border border-amber-200/70">
                    <span>
                      Ghee Yield: <strong>{((parseFloat(testPercentage) || 51) - 1).toFixed(1)}%</strong> ({(((parseFloat(testPercentage) || 51) - 1) * 10).toFixed(0)}g/kg)
                    </span>
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span>
                      Mandi Ghee Value: <strong>₹{((parseFloat(baseRate) || 335) * 2).toFixed(2)}/kg</strong>
                    </span>
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span className="text-amber-800 font-medium">
                      Rate = ₹{baseRate || 335} × (({testPercentage || 51} - 1) / 50) = ₹{ratePerKg}/kg
                    </span>
                  </div>
                </div>
              ) : (
                /* Standard Category: Qty & Rate & Amount */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Quantity (kg/किलो - 3 Decimals)</label>
                      <input
                        type="number"
                        step="any"
                        value={quantityKg}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        placeholder="e.g. 20.000"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                      {/* Radio: Adjust Quantity (Default) */}
                      <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-stone-700 font-semibold select-none">
                        <input
                          type="radio"
                          name="purchase_adjust_target_std"
                          value="qty"
                          checked={purchaseAdjustTarget !== 'rate'}
                          onChange={() => setPurchaseAdjustTarget('qty')}
                          className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>Adjust Qty (वजन बदले - Default)</span>
                      </label>
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Rate (₹/kg)</label>
                      <input
                        type="number"
                        step="any"
                        value={ratePerKg}
                        onChange={(e) => handleRateChange(e.target.value)}
                        placeholder="e.g. 300"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                      {/* Radio: Adjust Rate */}
                      <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-amber-950 font-semibold select-none">
                        <input
                          type="radio"
                          name="purchase_adjust_target_std"
                          value="rate"
                          checked={purchaseAdjustTarget === 'rate'}
                          onChange={() => setPurchaseAdjustTarget('rate')}
                          className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>Adjust Rate (रेट बदले)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Total Amount Paid (कुल भुगतान) ₹ *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      value={customTotal}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-base font-bold font-mono text-stone-900"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      Editing amount will auto-calculate quantity based on rate.
                    </span>
                  </div>
                </>
              )}

              {/* Payment Mode */}
              <div>
                <label className="block font-medium text-stone-700 mb-1">Payment Paid Via</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      paymentMode === 'cash'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>💵 Cash from Counter (गल्ला)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      paymentMode === 'online'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>📱 Online / Bank (UPI)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. morning batch, processed into 14kg pure ghee"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPurchase(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm cursor-pointer"
                >
                  {editingPurchase ? 'Update Entry (अपडेट करें)' : 'Save Entry (सुरक्षित करें)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {purchaseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Delete Purchase Entry? (खरीद हटाएं?)</h3>
                  <span className="text-xs text-stone-500">This record will be permanently deleted</span>
                </div>
              </div>
              <button
                onClick={() => setPurchaseToDelete(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Item / Title:</span>
                  <span className="font-bold text-stone-900">{purchaseToDelete.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Supplier / Payee:</span>
                  <span className="font-semibold text-stone-800">{purchaseToDelete.supplierOrPayee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount Paid:</span>
                  <span className="font-bold font-mono text-rose-700">{formatCurrency(purchaseToDelete.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Mode:</span>
                  <span>{purchaseToDelete.paymentMode === 'cash' ? '💵 Cash from Drawer' : '📱 Online / Bank'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Date:</span>
                  <span>{formatDateTime(purchaseToDelete.date)}</span>
                </div>
              </div>

              <p className="text-stone-500 text-[11.5px] pt-1">
                Deleting will remove this expense and restore the corresponding amount to your cash drawer or bank summary.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPurchaseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePurchase(purchaseToDelete.id);
                  setPurchaseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete (हटाएं)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function totalOnlinePaid(items: PurchaseExpense[]): number {
  return items
    .filter((p) => p.paymentMode === 'online')
    .reduce((sum, p) => sum + p.totalAmount, 0);
}
