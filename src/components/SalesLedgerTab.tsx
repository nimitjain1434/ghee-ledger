import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Sparkles,
  Phone,
  Send,
  Eye,
  AlertCircle,
  Filter,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { BusinessSettings, Sale } from '../types';
import {
  buildSaleWhatsAppMessage,
  formatCurrency,
  formatDateTime,
} from '../utils/formatters';

interface SalesLedgerTabProps {
  sales: Sale[];
  settings: BusinessSettings;
  onViewInvoice: (sale: Sale) => void;
  onOpenNewSale: () => void;
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (sale: Sale) => void;
}

export const SalesLedgerTab: React.FC<SalesLedgerTabProps> = ({
  sales,
  settings,
  onViewInvoice,
  onOpenNewSale,
  onEditSale,
  onDeleteSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerPhone.includes(searchTerm) ||
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter && !s.date.startsWith(dateFilter)) {
      return false;
    }

    if (modeFilter === 'cash') return s.cashReceived > 0;
    if (modeFilter === 'online') return s.onlineReceived > 0;
    if (modeFilter === 'pending') return s.pendingAmount > 0;

    return true;
  });

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCashCollected = filteredSales.reduce((sum, s) => sum + s.cashReceived, 0);
  const totalOnlineCollected = filteredSales.reduce((sum, s) => sum + s.onlineReceived, 0);
  const totalPendingBalance = filteredSales.reduce((sum, s) => sum + s.pendingAmount, 0);

  const handleShareWhatsApp = (sale: Sale) => {
    const msg = buildSaleWhatsAppMessage(sale, settings);

    const cleanPhone = sale.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Total Sales (कुल बिक्री)</span>
          <span className="text-xl font-black font-mono text-stone-900 mt-0.5 block">
            {formatCurrency(totalSalesAmount)}
          </span>
          <span className="text-[10px] text-stone-400">{filteredSales.length} bills generated</span>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Cash Received (गल्ले में)</span>
          <span className="text-xl font-black font-mono text-amber-900 mt-0.5 block">
            {formatCurrency(totalCashCollected)}
          </span>
          <span className="text-[10px] text-amber-700">Offline Drawer Cash</span>
        </div>

        <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-800 block">Online / Bank (बैंक में)</span>
          <span className="text-xl font-black font-mono text-indigo-900 mt-0.5 block">
            {formatCurrency(totalOnlineCollected)}
          </span>
          <span className="text-[10px] text-indigo-700">UPI / QR / Bank</span>
        </div>

        <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 block">Pending (उधार)</span>
          <span className="text-xl font-black font-mono text-rose-700 mt-0.5 block">
            {formatCurrency(totalPendingBalance)}
          </span>
          <span className="text-[10px] text-rose-600">To be collected</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            id="input-search-sales"
            type="text"
            placeholder="Search by Bill No, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:bg-white focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          {/* Date Picker */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-stone-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="ml-1 text-[10px] text-stone-500 underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mode pills */}
          <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            {(['all', 'cash', 'online', 'pending'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition ${
                  modeFilter === m
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {m === 'pending' ? 'Udhaar' : m}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewSale}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs ml-auto sm:ml-0"
          >
            + New Bill
          </button>
        </div>
      </div>

      {/* Sales Transactions List */}
      <div className="space-y-2.5">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-stone-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* Left: Customer + Product info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  {sale.invoiceNo}
                </span>
                <h3 className="text-sm font-bold text-stone-900">{sale.customerName}</h3>
                {sale.customerPhone ? (
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-stone-400" />
                    {sale.customerPhone}
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                    Walk-in / Cash
                  </span>
                )}
                {sale.isLoyaltyDiscountApplied && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    5% Scheme Applied
                  </span>
                )}
              </div>

              {/* Items summary */}
              <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {sale.items
                    .map((it) => `${it.productName} (${it.quantityKg.toFixed(3)} kg @ ₹${it.ratePerKg})`)
                    .join(' • ')}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-400 text-[11px]">{formatDateTime(sale.date)}</span>
              </div>

              {/* Payment chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                {(sale.previousUdhaar || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold font-mono">
                    📌 Prev. Udhaar: +{formatCurrency(sale.previousUdhaar || 0)}
                  </span>
                )}
                {(sale.advanceUsed || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-semibold font-mono">
                    💎 Advance Used: -{formatCurrency(sale.advanceUsed || 0)}
                  </span>
                )}
                {sale.cashReceived > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                    💵 Cash: {formatCurrency(sale.cashReceived)}
                  </span>
                )}
                {sale.onlineReceived > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold font-mono">
                    📱 Online: {formatCurrency(sale.onlineReceived)}
                  </span>
                )}
                {(sale.extraPaymentAdded || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold font-mono">
                    💰 Extra Saved (Advance): +{formatCurrency(sale.extraPaymentAdded || 0)}
                  </span>
                )}
                {(() => {
                  const totalDue = Math.max(
                    0,
                    (sale.previousUdhaar || 0) - (sale.previousUdhaarCleared || 0) + sale.pendingAmount
                  );
                  if (totalDue > 0) {
                    return (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold font-mono">
                        ⚠️ {totalDue > sale.pendingAmount ? 'Total Due' : 'Udhaar'}: {formatCurrency(totalDue)}
                      </span>
                    );
                  }
                  return (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      {(sale.previousUdhaarCleared || 0) > 0
                        ? `All Dues Cleared (Prev. ₹${sale.previousUdhaarCleared})`
                        : 'Fully Paid'}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Right: Total + Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 gap-2 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Bill</span>
                <span className="text-lg font-black font-mono text-stone-900">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  onClick={() => onViewInvoice(sale)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="View & Print Bill"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>Bill</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(sale)}
                  className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs transition cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onEditSale(sale)}
                  className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Edit this sale bill"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setSaleToDelete(sale)}
                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition cursor-pointer"
                  title="Delete this sale bill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
            <Receipt className="w-8 h-8 mx-auto text-stone-300" />
            <p className="mt-2 text-sm text-stone-600 font-medium">No sales bills found</p>
            <p className="text-xs text-stone-400 mt-1">Tap &quot;+ New Bill&quot; to create your first sale.</p>
          </div>
        )}
      </div>

      {/* Delete Sale Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Delete Sale Bill? (बिल हटाएं?)</h3>
                  <span className="text-xs text-stone-500 font-mono">Invoice: {saleToDelete.invoiceNo}</span>
                </div>
              </div>
              <button
                onClick={() => setSaleToDelete(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer (ग्राहक):</span>
                  <span className="font-bold text-stone-900">{saleToDelete.customerName}</span>
                </div>
                {saleToDelete.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Phone (मोबाइल):</span>
                    <span className="font-mono text-stone-700">{saleToDelete.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Date & Time:</span>
                  <span>{formatDateTime(saleToDelete.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Bill Amount:</span>
                  <span className="font-bold font-mono text-stone-900">{formatCurrency(saleToDelete.totalAmount)}</span>
                </div>
                {saleToDelete.pendingAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-stone-200">
                    <span>Pending Udhaar (उधार):</span>
                    <span className="font-mono">{formatCurrency(saleToDelete.pendingAmount)}</span>
                  </div>
                )}
              </div>

              {(saleToDelete.pendingAmount > 0 ||
                (saleToDelete.previousUdhaarCleared || 0) > 0 ||
                (saleToDelete.advanceUsed || 0) > 0 ||
                (saleToDelete.extraPaymentAdded || 0) > 0) ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11.5px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Deleting will automatically update {saleToDelete.customerName}&apos;s khata
                    {saleToDelete.pendingAmount > 0 && (
                      <> (deduct <strong>₹{saleToDelete.pendingAmount}</strong> new udhaar)</>
                    )}
                    {(saleToDelete.previousUdhaarCleared || 0) > 0 && (
                      <> (restore <strong>₹{saleToDelete.previousUdhaarCleared}</strong> previous udhaar)</>
                    )}
                    {(saleToDelete.advanceUsed || 0) > 0 && (
                      <> (restore <strong>₹{saleToDelete.advanceUsed}</strong> advance credit)</>
                    )}
                    {(saleToDelete.extraPaymentAdded || 0) > 0 && (
                      <> (remove <strong>₹{saleToDelete.extraPaymentAdded}</strong> extra advance saved)</>
                    )}
                    {' '}and recalculate drawer totals.
                  </span>
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Are you sure you want to delete this bill? This record will be removed from your sales ledger and daily cash drawer.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSale(saleToDelete);
                  setSaleToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Bill (हटाएं)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
