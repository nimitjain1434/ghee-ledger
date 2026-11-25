import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Send,
  Eye,
  PackageCheck,
  Clock,
  CheckCircle2,
  Receipt,
  Pencil,
  Trash2,
  Phone,
  Plus,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { BusinessSettings, Customer, OnlineOrder, OnlineOrderStatus, Sale } from '../types';
import {
  buildOnlineOrderWhatsAppMessage,
  formatCurrency,
  formatDateTime,
} from '../utils/formatters';

interface PendingOrdersTabProps {
  orders: OnlineOrder[];
  sales: Sale[];
  customers: Customer[];
  settings: BusinessSettings;
  onOpenNewOrder: () => void;
  onEditOrder: (order: OnlineOrder) => void;
  onUpdateStatus: (orderId: string, newStatus: OnlineOrderStatus) => void;
  onDeliverAndBill: (order: OnlineOrder) => void;
  onViewOrderReceipt: (order: OnlineOrder) => void;
  onViewFinalBill: (sale: Sale) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const PendingOrdersTab: React.FC<PendingOrdersTabProps> = ({
  orders,
  sales,
  customers,
  settings,
  onOpenNewOrder,
  onEditOrder,
  onUpdateStatus,
  onDeliverAndBill,
  onViewOrderReceipt,
  onViewFinalBill,
  onDeleteOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | OnlineOrderStatus | 'all'>('pending');
  const [recentStatusBanner, setRecentStatusBanner] = useState<{
    order: OnlineOrder;
    status: OnlineOrderStatus;
  } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OnlineOrder | null>(null);

  const pendingOrders = orders.filter((o) => o.status !== 'delivered');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const pendingGheeKg = pendingOrders.reduce((sum, o) => sum + (o.totalGheeKg || 0), 0);
  const pendingValue = pendingOrders.reduce((sum, o) => sum + (o.estimatedTotal || 0), 0);

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.orderNo.toLowerCase().includes(q) ||
      order.items.some((it) => it.productName.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return order.status !== 'delivered';
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const findOrderCustomer = (order: OnlineOrder): Customer | null => {
    return (
      customers.find(
        (c) =>
          c.id === order.customerId ||
          (order.customerPhone && c.phone === order.customerPhone)
      ) || null
    );
  };

  const getWhatsAppUrlForOrder = (order: OnlineOrder) => {
    const customer = findOrderCustomer(order);
    const msg = buildOnlineOrderWhatsAppMessage(order, settings, { customer });
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    return cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleStatusChange = (order: OnlineOrder, newStatus: OnlineOrderStatus) => {
    if (order.status === newStatus) return;
    onUpdateStatus(order.id, newStatus);
    const updatedOrder: OnlineOrder = {
      ...order,
      status: newStatus,
      readyAt: newStatus === 'ready' ? new Date().toISOString() : order.readyAt,
    };
    setRecentStatusBanner({ order: updatedOrder, status: newStatus });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Pending Orders (पेंडिंग ऑर्डर)
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-stone-900 mt-0.5 block">
            {pendingOrders.length} Orders
          </span>
          <span className="text-[10px] text-stone-500 font-mono tabular-nums">
            {pendingGheeKg.toFixed(3)} kg · {formatCurrency(pendingValue)}
          </span>
        </div>

        <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 shadow-xs">
          <span className="text-[11px] font-semibold text-sky-800 block">
            Confirmed (दुकान से मंगाया)
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-sky-900 mt-0.5 block">
            {confirmedOrders.length}
          </span>
          <span className="text-[10px] text-sky-700">Waiting to arrive at home</span>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">
            Ready at Home (घी आ गया है)
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-emerald-900 mt-0.5 block">
            {readyOrders.length}
          </span>
          <span className="text-[10px] text-emerald-700">Ready for customer pickup</span>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 block">
            Delivered &amp; Billed (पूर्ण)
          </span>
          <span className="text-xl font-black font-mono tabular-nums text-amber-900 mt-0.5 block">
            {deliveredOrders.length}
          </span>
          <span className="text-[10px] text-amber-700">Converted to final sale bills</span>
        </div>
      </div>

      {/* Instant Share Prompt Banner after changing order status */}
      {recentStatusBanner && (
        <div className="bg-emerald-900 text-white rounded-2xl p-3.5 shadow-sm border border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs">
              <p className="font-bold">
                Order #{recentStatusBanner.order.orderNo} ({recentStatusBanner.order.customerName}) updated to{' '}
                {recentStatusBanner.status === 'ready'
                  ? 'Ready for Pickup (घी आ गया है)'
                  : 'Confirmed (ऑर्डर कन्फर्म)'}
              </p>
              <p className="text-[11px] text-emerald-200">
                {recentStatusBanner.status === 'ready'
                  ? 'Now notify the customer on WhatsApp that their ghee is ready at home!'
                  : 'Send updated confirmation message or receipt on WhatsApp.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={getWhatsAppUrlForOrder(recentStatusBanner.order)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {recentStatusBanner.status === 'ready'
                  ? "Send 'Order Ready' WhatsApp"
                  : "Send 'Confirmed' WhatsApp"}
              </span>
            </a>
            <button
              type="button"
              onClick={() => onViewOrderReceipt(recentStatusBanner.order)}
              className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Receipt Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setRecentStatusBanner(null)}
              className="p-1.5 text-emerald-200 hover:text-white cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter Tabs & New Order CTA */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            id="input-search-orders"
            type="text"
            placeholder="Search Order No, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:bg-white focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs overflow-x-auto max-w-full">
            {(
              [
                { id: 'pending', label: `Pending (${pendingOrders.length})` },
                { id: 'confirmed', label: `Confirmed (${confirmedOrders.length})` },
                { id: 'ready', label: `Ready (${readyOrders.length})` },
                { id: 'delivered', label: `Delivered (${deliveredOrders.length})` },
                { id: 'all', label: 'All' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            id="btn-new-online-order"
            type="button"
            onClick={onOpenNewOrder}
            className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Online Order</span>
          </button>
        </div>
      </div>

      {/* Desktop Column Headers */}
      {filteredOrders.length > 0 && (
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          <div className="col-span-4">Order &amp; Customer</div>
          <div className="col-span-3">Items &amp; Est. Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Share &amp; Delivery Actions</div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">
                {searchTerm
                  ? 'No matching online orders found'
                  : statusFilter === 'pending'
                  ? 'No pending online orders right now'
                  : 'No orders in this filter'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Tap <strong>+</strong> (or <strong>New Online Order</strong>) and switch to{' '}
                <strong>Online Order</strong> when someone orders ghee on your phone.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewOrder}
              className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Online Order</span>
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const linkedSale = order.completedSaleId
              ? sales.find((s) => s.id === order.completedSaleId)
              : undefined;
            const linkedCustomer = findOrderCustomer(order);
            const prevUdhaar = Math.max(0, Math.round(linkedCustomer?.pendingBalance || 0));
            const availAdvance = Math.max(0, Math.round(linkedCustomer?.advanceBalance || 0));
            const grossAmt = Math.round(order.estimatedTotal) + prevUdhaar;
            const advAdjusted = Math.min(availAdvance, grossAmt);
            const netPayable = Math.max(0, grossAmt - advAdjusted);
            const waUrl = getWhatsAppUrlForOrder(order);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-stone-300 transition grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-center"
              >
                {/* Col 1: Order & Customer */}
                <div className="lg:col-span-4 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-mono font-bold text-sky-800">{order.orderNo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="font-bold text-sm text-stone-900 truncate">
                    {order.customerName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-mono">
                      {order.customerPhone || 'No mobile added'}
                    </span>
                  </div>
                  {order.notes && order.notes.trim() && (
                    <p className="text-[11px] text-stone-500 truncate">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Col 2: Items & Amount */}
                <div className="lg:col-span-3 space-y-1">
                  <div className="space-y-0.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="text-xs text-stone-700">
                        <span className="font-semibold text-stone-900">{it.productName}</span>
                        <span className="text-stone-500 font-mono tabular-nums ml-1">
                          ({it.quantityKg.toFixed(3)} kg × ₹{it.ratePerKg})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-black font-mono tabular-nums text-amber-800">
                    Est. {formatCurrency(order.estimatedTotal)}
                  </div>
                  {order.status !== 'delivered' && (prevUdhaar > 0 || advAdjusted > 0) && (
                    <div className="text-[11px] space-y-0.5 pt-0.5 font-mono tabular-nums">
                      {prevUdhaar > 0 && (
                        <div className="text-rose-700 font-semibold">
                          + Prev. Udhaar: {formatCurrency(prevUdhaar)}
                        </div>
                      )}
                      {advAdjusted > 0 && (
                        <div className="text-teal-700 font-semibold">
                          - Advance Credit: {formatCurrency(advAdjusted)}
                        </div>
                      )}
                      <div className="text-stone-900 font-bold">
                        Net Payable: {formatCurrency(netPayable)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 3: Shareable Status Column */}
                <div className="lg:col-span-2 space-y-1.5">
                  {order.status === 'delivered' ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered &amp; Billed</span>
                      </span>
                      {order.completedInvoiceNo && (
                        <div className="text-[11px] font-mono text-stone-500">
                          Bill #{order.completedInvoiceNo}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <select
                        aria-label={`Order status for ${order.orderNo}`}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value as OnlineOrderStatus)
                        }
                        className={`w-full py-2 px-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                          order.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-sky-50 border-sky-300 text-sky-900'
                        }`}
                      >
                        <option value="confirmed">✅ Confirmed (ऑर्डर पक्का)</option>
                        <option value="ready">📦 Ready / घी आ गया</option>
                      </select>
                      <span className="text-[10.5px] text-stone-500 block">
                        {order.status === 'ready'
                          ? 'Ghee at home — ready for pickup'
                          : 'Waiting for ghee from shop'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Col 4: Share on WhatsApp & Lifecycle Actions */}
                <div className="lg:col-span-3 flex flex-wrap items-center lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                  {order.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(order, 'ready')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition min-h-[40px]"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Ghee Arrived</span>
                    </button>
                  )}

                  {order.status !== 'delivered' && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition min-h-[40px] ${
                        order.status === 'ready'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title={
                        order.status === 'ready'
                          ? "Send 'Order Ready for Pickup' message on WhatsApp"
                          : "Send 'Order Confirmed' message on WhatsApp"
                      }
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{order.status === 'ready' ? "Send 'Ready' Msg" : "Confirm Msg"}</span>
                    </a>
                  )}

                  {order.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={() => onDeliverAndBill(order)}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition min-h-[40px]"
                      title="Customer picked up delivery — enter payment & generate final bill"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Deliver &amp; Bill</span>
                    </button>
                  )}

                  {order.status === 'delivered' && linkedSale && (
                    <button
                      type="button"
                      onClick={() => onViewFinalBill(linkedSale)}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition min-h-[40px]"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>View Final Bill</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewOrderReceipt(order)}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="View / Share Order Receipt Photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {order.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={() => onEditOrder(order)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Edit Order Details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setOrderToDelete(order)}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-500 hover:text-rose-600 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900">
                  Delete Order #{orderToDelete.orderNo}?
                </h3>
                <p className="text-xs text-stone-600">
                  This will remove the order for <strong>{orderToDelete.customerName}</strong>.
                  {orderToDelete.status === 'delivered'
                    ? ' The already-generated final sale bill in Sales Ledger will stay intact.'
                    : ''}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
