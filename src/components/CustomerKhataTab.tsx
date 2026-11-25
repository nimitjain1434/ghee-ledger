import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Sparkles,
  AlertCircle,
  Plus,
  Send,
  ArrowDownLeft,
  X,
  Clock,
  Receipt,
  Pencil,
  Wallet,
  UserPlus,
  MapPin,
} from 'lucide-react';
import { BusinessSettings, Customer, KhataPayment, Sale } from '../types';
import { checkCustomerLoyalty } from '../utils/loyalty';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { PaymentReceiptModal, PaymentReceiptData } from './PaymentReceiptModal';

interface CustomerKhataTabProps {
  customers: Customer[];
  sales: Sale[];
  khataPayments: KhataPayment[];
  settings?: BusinessSettings;
  shopName: string;
  onReceivePayment: (payment: KhataPayment, updatedCustomer: Customer) => void;
  onSelectCustomerForSale: (customer: Customer) => void;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
  onAddCustomer?: (newCustomer: Customer) => void;
}

export const CustomerKhataTab: React.FC<CustomerKhataTabProps> = ({
  customers,
  sales,
  khataPayments,
  settings,
  shopName,
  onReceivePayment,
  onSelectCustomerForSale,
  onUpdateCustomer,
  onAddCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'advance' | 'scheme_active' | 'recent_payments'>('all');

  // Receive Payment / Add Advance Modal state
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Edit / Add Customer Modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPendingBalance, setEditPendingBalance] = useState('');
  const [editAdvanceBalance, setEditAdvanceBalance] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Payment Confirmation Receipt Modal state
  const [activeReceiptData, setActiveReceiptData] = useState<PaymentReceiptData | null>(null);

  // Customer Details modal
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const shopSettings: BusinessSettings = settings || {
    shopName,
    ownerName: '',
    phone: '',
    address: '',
    gheeSchemeDiscountPercent: 5,
    schemeMonthsPerKg: 1,
    loyaltySchemeEnabled: true,
  };

  // Open Edit modal
  const openEditModal = (customer: Customer) => {
    setIsAddingCustomer(false);
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setEditAddress(customer.address || '');
    setEditPendingBalance((customer.pendingBalance || 0).toString());
    setEditAdvanceBalance((customer.advanceBalance || 0).toString());
    setEditNotes(customer.notes || '');
    setEditError(null);
  };

  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setIsAddingCustomer(true);
    setEditName('');
    setEditPhone('');
    setEditAddress('');
    setEditPendingBalance('0');
    setEditAdvanceBalance('0');
    setEditNotes('');
    setEditError(null);
  };

  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Customer Name is required.');
      return;
    }

    const cleanPhone = editPhone.trim();
    const pendingVal = Math.max(0, Math.round((parseFloat(editPendingBalance) || 0) * 100) / 100);
    const advanceVal = Math.max(0, Math.round((parseFloat(editAdvanceBalance) || 0) * 100) / 100);

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: trimmedName,
        phone: cleanPhone,
        address: editAddress.trim(),
        notes: editNotes.trim(),
        pendingBalance: pendingVal,
        advanceBalance: advanceVal,
      };
      onUpdateCustomer?.(updated);
      if (viewCustomer && viewCustomer.id === updated.id) {
        setViewCustomer(updated);
      }
      setEditingCustomer(null);
    } else if (isAddingCustomer) {
      const newCust: Customer = {
        id: `cust_${cleanPhone || Date.now()}`,
        name: trimmedName,
        phone: cleanPhone,
        address: editAddress.trim(),
        notes: editNotes.trim(),
        createdAt: new Date().toISOString(),
        totalPurchases: 0,
        totalGheeBoughtKg: 0,
        pendingBalance: pendingVal,
        advanceBalance: advanceVal,
      };
      onAddCustomer?.(newCust);
      setIsAddingCustomer(false);
    }
  };

  // Filters
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'pending') {
      return c.pendingBalance > 0;
    }

    if (filter === 'advance') {
      return (c.advanceBalance || 0) > 0;
    }

    if (filter === 'scheme_active') {
      const loyalty = checkCustomerLoyalty(c);
      return loyalty.isEligible;
    }

    return true;
  });

  const totalMarketUdhaar = customers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);
  const totalAdvanceCredit = customers.reduce((sum, c) => sum + (c.advanceBalance || 0), 0);
  const advanceCustomerCount = customers.filter((c) => (c.advanceBalance || 0) > 0).length;
  const totalSchemeActiveCustomers = customers.filter((c) => checkCustomerLoyalty(c).isEligible).length;

  // Live payment / advance preview math
  const parsedPayAmount = Math.max(0, Math.round((parseFloat(paymentAmount) || 0) * 100) / 100);
  const previewUdhaarCleared = payingCustomer
    ? Math.min(payingCustomer.pendingBalance || 0, parsedPayAmount)
    : 0;
  const previewExtraAdded = payingCustomer
    ? Math.max(0, Math.round((parsedPayAmount - previewUdhaarCleared) * 100) / 100)
    : 0;

  // Handle Receive Payment / Advance Deposit Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    setPaymentError(null);
    const amount = parsedPayAmount;
    if (amount <= 0) {
      setPaymentError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    const previousBalance = payingCustomer.pendingBalance || 0;
    const previousAdvance = payingCustomer.advanceBalance || 0;

    const udhaarCleared = Math.min(previousBalance, amount);
    const advanceAdded = Math.max(0, Math.round((amount - udhaarCleared) * 100) / 100);
    const remainingBalance = Math.max(0, Math.round((previousBalance - udhaarCleared) * 100) / 100);
    const remainingAdvance = Math.round((previousAdvance + advanceAdded) * 100) / 100;

    const defaultNote =
      advanceAdded > 0 && udhaarCleared > 0
        ? `Udhaar ₹${udhaarCleared} cleared + ₹${advanceAdded} extra advance`
        : advanceAdded > 0
        ? 'Extra / Advance money deposited (जमा)'
        : 'Udhaar clearance';

    const newPayment: KhataPayment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      customerId: payingCustomer.id,
      customerName: payingCustomer.name,
      customerPhone: payingCustomer.phone,
      date: new Date().toISOString(),
      amount,
      paymentMode,
      type: udhaarCleared === 0 && advanceAdded > 0 ? 'advance_deposit' : 'udhaar_repayment',
      udhaarCleared,
      advanceAdded,
      note: paymentNote.trim() || defaultNote,
    };

    const updatedCustomer: Customer = {
      ...payingCustomer,
      pendingBalance: remainingBalance,
      advanceBalance: remainingAdvance,
    };

    onReceivePayment(newPayment, updatedCustomer);

    // Immediately trigger Payment Confirmation Receipt Intimation Modal
    setActiveReceiptData({
      payment: newPayment,
      previousBalance,
      remainingBalance,
      advanceAdded,
      remainingAdvance,
    });

    setPayingCustomer(null);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentError(null);
  };

  // Open receipt for a historic payment
  const handleOpenPaymentReceipt = (payment: KhataPayment) => {
    const cust = customers.find((c) => c.id === payment.customerId || c.phone === payment.customerPhone);
    const currBalance = cust ? cust.pendingBalance : 0;
    const currAdvance = cust ? cust.advanceBalance || 0 : 0;
    const udhaarPart =
      payment.udhaarCleared !== undefined
        ? payment.udhaarCleared
        : Math.max(0, payment.amount - (payment.advanceAdded || 0));
    setActiveReceiptData({
      payment,
      previousBalance: currBalance + udhaarPart,
      remainingBalance: currBalance,
      advanceAdded: payment.advanceAdded,
      remainingAdvance: currAdvance,
    });
  };

  // WhatsApp Reminder / Balance Summary
  const handleSendReminder = (customer: Customer) => {
    const loyalty = checkCustomerLoyalty(customer);
    let msg = `🙏 *${shopSettings.shopName}* 🙏\n`;
    msg += `नमस्ते *${customer.name}* जी,\n\n`;
    if (customer.pendingBalance > 0) {
      msg += `🚨 *बकाया बिल सूचना / PENDING PAYMENT NOTICE* 🚨\n`;
      msg += `आपके शुद्ध देसी घी खाते की कुल बकाया राशि: *₹${customer.pendingBalance.toLocaleString('en-IN')}* है।\n`;
      msg += `कृपया अपनी बकाया राशि का भुगतान जल्द से जल्द करने की कृपा करें।\n`;
      if (shopSettings.phone) {
        msg += `UPI / Phone: ${shopSettings.phone}\n`;
      }
      msg += `\n`;
    }
    if ((customer.advanceBalance || 0) > 0) {
      msg += `💰 *एडवांस जमा राशि / ADVANCE CREDIT:*\n`;
      msg += `आपके खाते में *₹${(customer.advanceBalance || 0).toLocaleString('en-IN')}* अतिरिक्त जमा (Advance) हैं, जो आपकी अगली खरीद के बिल में अपने आप घट जाएंगे।\n\n`;
    }
    if (loyalty.isEligible) {
      msg += `🌟 *Desi Ghee Repeat Customer Scheme:*\nआपके पास *5% DISCOUNT* सक्रिय है जो *${loyalty.expiresAtFormatted}* (${loyalty.daysRemaining} दिन शेष) तक मान्य है!\n\n`;
    }
    msg += `🧈 *${shopSettings.shopName}*\nआपका दिन शुभ हो।`;

    let cleanPhone = customer.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      const promptPhone = window.prompt('Enter customer WhatsApp mobile number:', '');
      if (!promptPhone) return;
      cleanPhone = promptPhone.replace(/\D/g, '');
    }

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total Customers (कुल ग्राहक)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-900 mt-1">
            {customers.length}
          </div>
          <span className="text-[11px] text-stone-400">Editable khata directory</span>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-3.5 sm:p-4 border border-rose-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-700 block">Total Udhaar (कुल बकाया)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-1">
            {formatCurrency(totalMarketUdhaar)}
          </div>
          <span className="text-[11px] text-rose-600">Pending to collect</span>
        </div>

        <div className="bg-teal-50/70 rounded-2xl p-3.5 sm:p-4 border border-teal-200 shadow-xs">
          <span className="text-xs font-semibold text-teal-800 block">Customer Advance (एडवांस जमा)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-teal-800 mt-1">
            {formatCurrency(totalAdvanceCredit)}
          </div>
          <span className="text-[11px] text-teal-700">
            {advanceCustomerCount} customer(s) gave extra money
          </span>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-3.5 sm:p-4 border border-amber-300 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block">Active 5% Scheme</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-900 mt-1">
            {totalSchemeActiveCustomers} Customers
          </div>
          <span className="text-[11px] text-amber-700">Repeat ghee discount active</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              id="input-search-customers"
              type="text"
              placeholder="Search by Name, Phone, or Address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:bg-white focus:border-amber-500"
            />
          </div>

          {onAddCustomer && (
            <button
              onClick={openAddCustomerModal}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Customer (नया ग्राहक)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full overflow-x-auto text-xs pb-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-stone-900 text-white font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              filter === 'pending'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Pending Udhaar ({customers.filter((c) => c.pendingBalance > 0).length})
          </button>
          <button
            onClick={() => setFilter('advance')}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              filter === 'advance'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Advance Jama ({advanceCustomerCount})
          </button>
          <button
            onClick={() => setFilter('scheme_active')}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              filter === 'scheme_active'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            5% Scheme ({totalSchemeActiveCustomers})
          </button>
          <button
            onClick={() => setFilter('recent_payments')}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              filter === 'recent_payments'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Receipts &amp; Advances ({khataPayments.length})
          </button>
        </div>
      </div>

      {/* RECENT PAYMENTS VIEW (When filter === 'recent_payments') */}
      {filter === 'recent_payments' ? (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Udhaar &amp; Extra Advance Payments (प्राप्त भुगतान, एडवांस व रसीदें)
              </h3>
              <p className="text-xs text-stone-500">
                Click on any payment to re-send WhatsApp confirmation receipt or print.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Total: {formatCurrency(khataPayments.reduce((s, p) => s + p.amount, 0))}
            </span>
          </div>

          {khataPayments.length === 0 ? (
            <div className="py-10 text-center text-stone-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs">No payments received yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {khataPayments.map((pmt) => (
                <div
                  key={pmt.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 hover:border-emerald-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{pmt.customerName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                        {pmt.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        {pmt.paymentMode === 'cash' ? '💵 Cash' : '📱 Online'}
                      </span>
                      {(pmt.advanceAdded || 0) > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          +₹{pmt.advanceAdded} Advance Saved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2">
                      <span>{formatDateTime(pmt.date)}</span>
                      {pmt.customerPhone && <span>• Ph: {pmt.customerPhone}</span>}
                      {pmt.note && <span>• {pmt.note}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-700 text-base block">
                        +{formatCurrency(pmt.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenPaymentReceipt(pmt)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Customer Directory Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((customer) => {
            const loyalty = checkCustomerLoyalty(customer);
            const advBalance = customer.advanceBalance || 0;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-amber-300 transition flex flex-col justify-between space-y-3"
              >
                {/* Header: Name + Phone + Balances */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-stone-900 leading-tight truncate">
                      {customer.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mt-1">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-mono font-medium">
                        {customer.phone || 'No phone recorded'}
                      </span>
                      {customer.address && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 truncate max-w-[150px]">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            {customer.address}
                          </span>
                        </>
                      )}
                    </div>
                    {customer.notes && (
                      <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-1">
                        Note: {customer.notes}
                      </p>
                    )}
                  </div>

                  {/* Balance badges */}
                  <div className="text-right shrink-0 space-y-1">
                    {customer.pendingBalance > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-500 block">
                          Pending Udhaar
                        </span>
                        <span className="text-base font-black font-mono text-rose-700">
                          {formatCurrency(customer.pendingBalance)}
                        </span>
                      </div>
                    )}
                    {advBalance > 0 && (
                      <div className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200">
                        <span className="text-[9.5px] uppercase font-bold text-teal-700 block">
                          Advance (जमा)
                        </span>
                        <span className="text-sm font-black font-mono text-teal-800">
                          {formatCurrency(advBalance)}
                        </span>
                      </div>
                    )}
                    {customer.pendingBalance <= 0 && advBalance <= 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium inline-block">
                        No Due (साफ)
                      </span>
                    )}
                  </div>
                </div>

                {/* Loyalty Scheme Pill */}
                {loyalty.isEligible ? (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-950 gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 block">5% Desi Ghee Discount Active!</span>
                        <span className="text-[11px] text-stone-600">
                          Valid till {loyalty.expiresAtFormatted} ({loyalty.daysRemaining} days left)
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0">
                      {customer.totalGheeBoughtKg.toFixed(3)} kg
                    </span>
                  </div>
                ) : customer.lastGheePurchaseDate ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Previous scheme expired on {loyalty.expiresAtFormatted || 'earlier'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Total: {customer.totalGheeBoughtKg.toFixed(3)} kg
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-400 italic">
                    New customer • Next ghee purchase will start scheme!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        setPayingCustomer(customer);
                        setPaymentAmount(
                          customer.pendingBalance > 0 ? customer.pendingBalance.toString() : ''
                        );
                        setPaymentNote('');
                        setPaymentError(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-white font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer ${
                        customer.pendingBalance > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      title={
                        customer.pendingBalance > 0
                          ? 'Collect Udhaar payment or accept extra advance money'
                          : 'Accept extra / advance money to deduct from next bill'
                      }
                    >
                      {customer.pendingBalance > 0 ? (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Collect / Advance</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-3.5 h-3.5" />
                          <span>+ Advance (जमा)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectCustomerForSale(customer)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold border border-amber-200 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <span>New Bill</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {onUpdateCustomer && (
                      <button
                        onClick={() => openEditModal(customer)}
                        title="Edit Customer Details & Balances"
                        className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleSendReminder(customer)}
                      title="Send WhatsApp balance & details"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewCustomer(customer)}
                      className="px-2 py-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-medium cursor-pointer"
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
              <Users className="w-8 h-8 mx-auto text-stone-300" />
              <p className="mt-2 text-sm text-stone-600 font-medium">
                No customers found matching &quot;{searchTerm}&quot;
              </p>
              <p className="text-xs text-stone-400">
                Use &quot;+ Add Customer&quot; or create a sale to record a customer.
              </p>
            </div>
          )}
        </div>
      )}

      {/* COLLECT PAYMENT / ADD EXTRA ADVANCE MODAL */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {payingCustomer.pendingBalance > 0
                    ? 'Collect Payment / Add Advance (वसूली / जमा)'
                    : 'Record Extra / Advance Money (एडवांस जमा)'}
                </h3>
                <p className="text-xs text-stone-500">
                  Customer: <strong>{payingCustomer.name}</strong>{' '}
                  {payingCustomer.phone ? `(${payingCustomer.phone})` : ''}
                </p>
              </div>
              <button
                onClick={() => setPayingCustomer(null)}
                className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} noValidate className="mt-4 space-y-3.5 text-xs">
              {paymentError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                  <span className="text-[10px] font-bold uppercase block text-rose-600">
                    Current Pending Udhaar:
                  </span>
                  <span className="font-mono font-black text-sm">
                    {formatCurrency(payingCustomer.pendingBalance || 0)}
                  </span>
                </div>
                <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200 text-teal-900">
                  <span className="text-[10px] font-bold uppercase block text-teal-700">
                    Current Advance (जमा):
                  </span>
                  <span className="font-mono font-black text-sm">
                    {formatCurrency(payingCustomer.advanceBalance || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Amount Received (प्राप्त राशि) ₹ *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  placeholder="Enter amount (e.g. 1000)"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    setPaymentError(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-base font-bold font-mono focus:border-amber-500"
                />
                <p className="text-[10.5px] text-stone-500 mt-1">
                  You can enter more than pending Udhaar — any extra amount is automatically saved as Advance Credit for their next bill!
                </p>
              </div>

              {/* Live Allocation Breakdown */}
              {parsedPayAmount > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-1">
                  {previewUdhaarCleared > 0 && (
                    <div className="flex justify-between text-stone-700">
                      <span>Clears Pending Udhaar:</span>
                      <span className="font-mono font-bold text-rose-700">
                        -{formatCurrency(previewUdhaarCleared)}
                      </span>
                    </div>
                  )}
                  {previewExtraAdded > 0 && (
                    <div className="flex justify-between text-teal-800 font-bold">
                      <span>Extra Money → Saved to Advance Credit:</span>
                      <span className="font-mono">+{formatCurrency(previewExtraAdded)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-stone-900">
                    <span>
                      {previewExtraAdded > 0 ? 'New Total Advance Balance:' : 'Remaining Udhaar:'}
                    </span>
                    <span className="font-mono">
                      {previewExtraAdded > 0
                        ? formatCurrency((payingCustomer.advanceBalance || 0) + previewExtraAdded)
                        : formatCurrency(Math.max(0, (payingCustomer.pendingBalance || 0) - previewUdhaarCleared))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Received in (कहाँ प्राप्त हुआ?)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'cash'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>💵 Cash (गल्ला)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'online'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>📱 Online / UPI (बैंक)</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {paymentMode === 'cash'
                    ? 'This will immediately add to today’s Cash Counter drawer total!'
                    : 'This will add to today’s Bank Account collection total!'}
                </p>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Note / Reference (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance money for next ghee tin"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  Confirm &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADD CUSTOMER KHATA MODAL */}
      {(editingCustomer || isAddingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {editingCustomer
                    ? 'Edit Customer Khata (ग्राहक खाता सुधारें)'
                    : 'Add New Customer (नया ग्राहक जोड़ें)'}
                </h3>
                <p className="text-xs text-stone-500">
                  Update customer name, phone, address, or khata balances.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setIsAddingCustomer(false);
                }}
                className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} noValidate className="mt-4 space-y-3 text-xs">
              {editError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Customer Name (ग्राहक का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditError(null);
                  }}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mobile Number (मोबाइल नंबर)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9820011223"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Address / Area (पता / मोहल्ला)
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Sector 4, Near Temple"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    Pending Udhaar (बकाया ₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editPendingBalance}
                    onChange={(e) => setEditPendingBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/40 text-sm font-mono font-bold text-rose-800 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-teal-800 mb-1">
                    Advance / Extra (जमा ₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editAdvanceBalance}
                    onChange={(e) => setEditAdvanceBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-teal-50/40 text-sm font-mono font-bold text-teal-900 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Khata Note (टिप्पणी - optional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Monthly regular ghee buyer"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomer(null);
                    setIsAddingCustomer(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  {editingCustomer ? 'Save Changes (सुरक्षित करें)' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER HISTORY MODAL */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">{viewCustomer.name}</h3>
                <p className="text-xs text-stone-500">
                  Phone: {viewCustomer.phone || 'Not recorded'}
                  {viewCustomer.address ? ` • ${viewCustomer.address}` : ''}
                </p>
                {viewCustomer.notes && (
                  <p className="text-[11px] text-stone-500 italic mt-0.5">Note: {viewCustomer.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onUpdateCustomer && (
                  <button
                    onClick={() => openEditModal(viewCustomer)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => setViewCustomer(null)}
                  className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="py-4 overflow-y-auto space-y-3 text-xs">
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Total Purchases</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {formatCurrency(viewCustomer.totalPurchases)}
                  </span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 block">Ghee Bought</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {viewCustomer.totalGheeBoughtKg} kg
                  </span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-600 block">Pending Due</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    {formatCurrency(viewCustomer.pendingBalance)}
                  </span>
                </div>
                <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                  <span className="text-[10px] text-teal-700 block">Advance (जमा)</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">
                    {formatCurrency(viewCustomer.advanceBalance || 0)}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-stone-800 pt-2 border-t border-stone-100">
                Purchase History (खरीद का इतिहास)
              </h4>
              <div className="space-y-2">
                {sales
                  .filter(
                    (s) =>
                      s.customerId === viewCustomer.id ||
                      (viewCustomer.phone && s.customerPhone === viewCustomer.phone)
                  )
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex justify-between items-center gap-2"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">
                          {s.items.map((it) => `${it.productName} (${it.quantityKg}kg)`).join(', ')}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          {s.invoiceNo} • {formatDate(s.date)} • Mode:{' '}
                          <span className="uppercase font-bold text-stone-700">{s.paymentMode}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(s.previousUdhaar || 0) > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              Prev. Udhaar: +{formatCurrency(s.previousUdhaar || 0)}
                            </span>
                          )}
                          {(s.previousUdhaarCleared || 0) > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              Prev. Cleared: {formatCurrency(s.previousUdhaarCleared || 0)}
                            </span>
                          )}
                          {(s.advanceUsed || 0) > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                              Advance Used: -{formatCurrency(s.advanceUsed || 0)}
                            </span>
                          )}
                          {(s.extraPaymentAdded || 0) > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Extra Saved to Advance: +{formatCurrency(s.extraPaymentAdded || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-stone-900 block">
                          {formatCurrency(s.totalAmount)}
                        </span>
                        {(() => {
                          const totalDue = Math.max(
                            0,
                            (s.previousUdhaar || 0) - (s.previousUdhaarCleared || 0) + s.pendingAmount
                          );
                          if (totalDue > 0) {
                            return (
                              <span className="text-[10px] text-rose-600 font-semibold">
                                {totalDue > s.pendingAmount ? 'Total Due' : 'Udhaar'}: {formatCurrency(totalDue)}
                              </span>
                            );
                          }
                          return <span className="text-[10px] text-emerald-600 font-semibold">Paid</span>;
                        })()}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Payment & Advance Receipts History */}
              <h4 className="font-bold text-emerald-800 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span>Payments &amp; Advance Deposits (भुगतान व एडवांस रसीदें)</span>
                <span className="text-[11px] text-stone-500 font-normal">
                  {
                    khataPayments.filter(
                      (p) =>
                        p.customerId === viewCustomer.id ||
                        (viewCustomer.phone && p.customerPhone === viewCustomer.phone)
                    ).length
                  }{' '}
                  entries
                </span>
              </h4>
              <div className="space-y-2">
                {khataPayments
                  .filter(
                    (p) =>
                      p.customerId === viewCustomer.id ||
                      (viewCustomer.phone && p.customerPhone === viewCustomer.phone)
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex justify-between items-center gap-2"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-emerald-900">{formatCurrency(p.amount)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                            {p.paymentMode === 'cash' ? '💵 Cash' : '📱 Online'}
                          </span>
                          {(p.advanceAdded || 0) > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                              +₹{p.advanceAdded} Advance
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          {p.id} • {formatDateTime(p.date)} {p.note ? `• ${p.note}` : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenPaymentReceipt(p)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  ))}
                {khataPayments.filter(
                  (p) =>
                    p.customerId === viewCustomer.id ||
                    (viewCustomer.phone && p.customerPhone === viewCustomer.phone)
                ).length === 0 && (
                  <p className="text-[11px] text-stone-400 italic">No payments recorded yet.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 text-right">
              <button
                onClick={() => setViewCustomer(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT CONFIRMATION RECEIPT MODAL */}
      <PaymentReceiptModal
        receiptData={activeReceiptData}
        settings={shopSettings}
        onClose={() => setActiveReceiptData(null)}
      />
    </div>
  );
};
