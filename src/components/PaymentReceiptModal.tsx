import React from 'react';
import { X, Printer, Send, CheckCircle2, Download, Smartphone } from 'lucide-react';
import { BusinessSettings, KhataPayment } from '../types';
import { formatCurrency, formatDateTime, generatePaymentReceiptWhatsAppMessage } from '../utils/formatters';
import { downloadElementAsHtml, printElement } from '../utils/printHelper';

export interface PaymentReceiptData {
  payment: KhataPayment;
  previousBalance: number;
  remainingBalance: number;
  advanceAdded?: number;
  remainingAdvance?: number;
}

interface PaymentReceiptModalProps {
  receiptData: PaymentReceiptData | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  receiptData,
  settings,
  onClose,
}) => {
  if (!receiptData) return null;

  const {
    payment,
    previousBalance,
    remainingBalance,
    advanceAdded = payment.advanceAdded || 0,
    remainingAdvance = 0,
  } = receiptData;

  const handlePrint = () => {
    printElement('printable-payment-receipt-area', `Receipt_${payment.id} - ${settings.shopName}`);
  };

  const handleDownload = () => {
    downloadElementAsHtml(
      'printable-payment-receipt-area',
      `Payment_Receipt_${payment.id}.html`,
      `Payment Receipt #${payment.id} - ${settings.shopName}`
    );
  };

  const handleShareWhatsApp = () => {
    const msg = generatePaymentReceiptWhatsAppMessage({
      shopName: settings.shopName,
      shopPhone: settings.phone,
      customerName: payment.customerName,
      receiptNo: payment.id,
      date: payment.date,
      amountReceived: payment.amount,
      paymentMode: payment.paymentMode,
      previousBalance,
      remainingBalance,
      advanceAdded,
      remainingAdvance,
      note: payment.note,
      customTemplate: settings.whatsAppTemplates?.paymentConfirmationTemplate,
    });

    let cleanPhone = payment.customerPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      const promptPhone = window.prompt('Enter customer WhatsApp mobile number:', '');
      if (!promptPhone) return;
      cleanPhone = promptPhone.replace(/\D/g, '');
    }
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="text-xs font-bold font-mono">Payment Confirmation</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-stone-100 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-stone-100 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Download Receipt Document"
            >
              <Download className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Send WhatsApp Confirmation"
            >
              <Send className="w-4 h-4" />
              <span className="text-[11px]">Send WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div
          id="printable-payment-receipt-area"
          className="p-5 overflow-y-auto space-y-4 text-xs text-stone-800 font-sans print:p-0"
        >
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-stone-200 space-y-1">
            <span className="text-2xl">🧈</span>
            <h2 className="text-base font-black text-stone-950">{settings.shopName}</h2>
            <p className="text-[11px] text-stone-500">
              Pure Desi Ghee & Fresh Dairy Cream • भुगतान पावती / रसीद
            </p>
            <p className="text-[11px] text-stone-500">
              {settings.address} • Ph: {settings.phone}
            </p>
          </div>

          {/* Payment Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
              Payment Received • भुगतान प्राप्त हुआ
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700">
              {formatCurrency(payment.amount)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-900 flex flex-wrap items-center justify-center gap-1.5">
              <span>Mode:</span>
              <span className="uppercase px-2 py-0.5 rounded-md bg-emerald-200/80 font-bold">
                {payment.paymentMode === 'cash' ? '💵 Cash (नकद)' : '📱 Online / UPI (ऑनलाइन)'}
              </span>
              {advanceAdded > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300 font-bold">
                  + {formatCurrency(advanceAdded)} Saved as Advance (जमा)
                </span>
              )}
            </div>
          </div>

          {/* Customer & Receipt Metadata */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-stone-400 block text-[10px]">Customer:</span>
                <span className="font-bold text-stone-900 text-sm block">{payment.customerName}</span>
                <span className="font-mono text-stone-600 text-[11px]">
                  {payment.customerPhone ? `Ph: ${payment.customerPhone}` : 'Direct Customer'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px]">Receipt No:</span>
                <span className="font-mono font-bold text-stone-800 text-[11px] block">
                  {payment.id}
                </span>
                <span className="text-stone-500 text-[10px]">{formatDateTime(payment.date)}</span>
              </div>
            </div>

            {payment.note && (
              <div className="pt-2 border-t border-stone-200 text-stone-600 text-[11px]">
                <span className="font-semibold text-stone-700">Note:</span> {payment.note}
              </div>
            )}
          </div>

          {/* Khata Ledger Statement Box */}
          <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-white">
            <span className="font-bold text-stone-900 text-xs block border-b border-stone-100 pb-1.5">
              Customer Khata Summary (खाता स्थिति)
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Previous Balance (पिछला बकाया):</span>
                <span className="font-mono font-semibold">{formatCurrency(previousBalance)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Payment Received (जमा किया):</span>
                <span className="font-mono">- {formatCurrency(payment.amount)}</span>
              </div>

              {advanceAdded > 0 && (
                <div className="flex justify-between text-teal-700 font-bold">
                  <span>Extra Added to Advance (एडवांस जमा):</span>
                  <span className="font-mono">+ {formatCurrency(advanceAdded)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                <span className="font-bold text-stone-900">
                  {remainingBalance > 0
                    ? 'Remaining Balance (शेष बकाया):'
                    : 'Remaining Udhaar Balance:'}
                </span>
                <span
                  className={`font-mono font-black text-sm ${
                    remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </span>
              </div>

              {remainingAdvance > 0 && (
                <div className="flex justify-between items-center text-teal-800 font-bold pt-1">
                  <span>Total Advance Credit Available (एडवांस बैलेंस):</span>
                  <span className="font-mono text-sm text-teal-700">
                    {formatCurrency(remainingAdvance)}
                  </span>
                </div>
              )}
            </div>

            {remainingAdvance > 0 ? (
              <div className="mt-2 text-center py-1.5 px-2 bg-teal-50 text-teal-900 font-bold text-[11px] rounded-lg border border-teal-200">
                💰 Customer Advance Credit: <strong>{formatCurrency(remainingAdvance)}</strong> (will auto-deduct from next bill)
              </div>
            ) : remainingBalance === 0 ? (
              <div className="mt-2 text-center py-1 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200">
                🎉 All dues cleared! खाता पूर्ण चुकता।
              </div>
            ) : (
              <div className="mt-2 text-center py-1 bg-amber-50 text-amber-900 text-[11px] rounded-lg border border-amber-200">
                Remaining due balance: <strong>{formatCurrency(remainingBalance)}</strong>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-stone-100">
            Thank you for your payment! • शुद्धता ही हमारी पहचान
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Send Confirmation (व्हाट्सएप भेजें)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
