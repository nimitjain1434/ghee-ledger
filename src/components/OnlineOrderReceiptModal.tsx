import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Send,
  CheckCircle,
  Phone,
  Download,
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
  PackageCheck,
  Clock,
  Receipt,
} from 'lucide-react';
import { BusinessSettings, Customer, OnlineOrder, OnlineOrderStatus } from '../types';
import {
  buildOnlineOrderWhatsAppMessage,
  formatCurrency,
  formatDateTime,
} from '../utils/formatters';
import {
  downloadElementAsImage,
  printElement,
  shareElementAsImage,
} from '../utils/printHelper';

interface OnlineOrderReceiptModalProps {
  order: OnlineOrder | null;
  customer?: Customer | null;
  settings: BusinessSettings;
  onClose: () => void;
  onChangeStatus?: (orderId: string, newStatus: OnlineOrderStatus) => void;
  onDeliverAndBill?: (order: OnlineOrder) => void;
}

interface MediaPanelState {
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
}

export const OnlineOrderReceiptModal: React.FC<OnlineOrderReceiptModalProps> = ({
  order,
  customer,
  settings,
  onClose,
  onChangeStatus,
  onDeliverAndBill,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [mediaResult, setMediaResult] = useState<MediaPanelState | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>(
    order ? order.customerPhone.replace(/\D/g, '') : ''
  );

  useEffect(() => {
    setMediaResult(null);
    setImageCopied(false);
    setRecipientPhone(order ? order.customerPhone.replace(/\D/g, '') : '');
  }, [order?.id, order?.customerPhone, order?.status]);

  if (!order) return null;

  const docTitle = `Order_${order.orderNo}_${settings.shopName.replace(/\s+/g, '_')}`;

  const currentOrderAmount = Math.round(order.estimatedTotal);
  const previousUdhaar = Math.max(0, Math.round(customer?.pendingBalance || 0));
  const availableAdvance = Math.max(0, Math.round(customer?.advanceBalance || 0));
  const grossTotal = currentOrderAmount + previousUdhaar;
  const advanceAdjusted = Math.min(availableAdvance, grossTotal);
  const netPayable = Math.max(0, grossTotal - advanceAdjusted);
  const remainingAdvance = Math.max(0, availableAdvance - advanceAdjusted);
  const hasKhataAdjustment = previousUdhaar > 0 || advanceAdjusted > 0;
  const homePickupAddress = settings.homeAddress?.trim();

  const buildWhatsAppUrl = (attachmentKind?: 'image', customPhone?: string) => {
    const targetPhone = (customPhone !== undefined ? customPhone : recipientPhone).replace(/\D/g, '');
    const msg = buildOnlineOrderWhatsAppMessage(order, settings, {
      attachmentKind,
      customer,
    });
    return targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handlePrint = () => {
    printElement('printable-order-receipt-area', `Order #${order.orderNo} - ${settings.shopName}`);
  };

  const handleDownloadPhoto = async () => {
    setIsGenerating(true);
    setImageCopied(false);
    try {
      const res = await downloadElementAsImage('printable-order-receipt-area', `${docTitle}.png`);
      setMediaResult({
        filename: res.filename,
        whatsappUrl: buildWhatsAppUrl('image'),
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
        error: res.success ? undefined : res.error || 'Could not download receipt photo.',
      });
    } catch (err: any) {
      setMediaResult({
        filename: `${docTitle}.png`,
        whatsappUrl: buildWhatsAppUrl('image'),
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate order receipt photo.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsAppPhoto = async () => {
    setIsGenerating(true);
    setImageCopied(false);
    setMediaResult(null);

    const filename = `${docTitle}.png`;
    const waUrl = buildWhatsAppUrl('image');
    const caption = buildOnlineOrderWhatsAppMessage(order, settings, {
      attachmentKind: 'image',
      customer,
    });

    try {
      const res = await shareElementAsImage('printable-order-receipt-area', filename, {
        title: `Order #${order.orderNo} - ${settings.shopName}`,
        text: caption,
        whatsappFallbackUrl: waUrl,
      });

      setMediaResult({
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
      setMediaResult({
        filename,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not capture order receipt photograph.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPhoto = async () => {
    if (!mediaResult?.blob || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      return;
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': mediaResult.blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2500);
    } catch (err) {
      console.warn('Copy image failed:', err);
    }
  };

  const canCopyImage =
    Boolean(mediaResult?.blob) &&
    typeof ClipboardItem !== 'undefined' &&
    Boolean(navigator.clipboard?.write);

  const directMsgUrl = buildWhatsAppUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold font-mono bg-sky-900/80 px-2 py-0.5 rounded text-sky-200 shrink-0">
              #{order.orderNo}
            </span>
            <span className="text-xs text-stone-300 truncate">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Print Order Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsAppPhoto}
              disabled={isGenerating}
              className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
              title="Capture crisp Order Receipt photo & send on WhatsApp"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span className="text-[11px]">WhatsApp Photo</span>
            </button>

            <a
              href={directMsgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs flex items-center gap-1 transition cursor-pointer font-semibold"
              title="Send status message directly on WhatsApp"
            >
              <Send className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Msg</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadPhoto}
              disabled={isGenerating}
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Download Order Receipt Photo (PNG)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Photo / Share Interaction Panel */}
        {mediaResult && (
          <div
            className={`p-3 sm:p-4 border-b shrink-0 space-y-2.5 max-h-[48vh] overflow-y-auto ${
              mediaResult.error
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-emerald-950 text-emerald-100 border-emerald-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {mediaResult.error ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {mediaResult.error
                      ? mediaResult.error
                      : mediaResult.sharedViaWebShare
                      ? 'Order Receipt Photo Sent!'
                      : mediaResult.downloaded
                      ? 'Order Receipt Photo Saved!'
                      : 'Order Receipt Photo Ready!'}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    File: <span className="font-mono font-bold text-white">{mediaResult.filename}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMediaResult(null)}
                className="opacity-80 hover:opacity-100 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {mediaResult.dataUrl && !mediaResult.error && (
              <div className="bg-white rounded-xl p-2 border border-emerald-700/60 text-center space-y-1">
                <img
                  src={mediaResult.dataUrl}
                  alt={`Order #${order.orderNo} Receipt`}
                  className="max-h-44 w-auto mx-auto rounded-lg object-contain border border-stone-200"
                />
              </div>
            )}

            {!mediaResult.error && (
              <div className="flex flex-wrap items-center gap-2">
                {(mediaResult.blobUrl || mediaResult.dataUrl) && (
                  <a
                    href={mediaResult.blobUrl || mediaResult.dataUrl}
                    download={mediaResult.filename}
                    type="image/png"
                    className="px-3 py-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Save Photo (PNG)</span>
                  </a>
                )}

                {mediaResult.file && mediaResult.canWebShareFiles && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await (navigator as any).share({
                          files: [mediaResult.file],
                          title: `Order #${order.orderNo} - ${settings.shopName}`,
                          text: buildOnlineOrderWhatsAppMessage(order, settings, {
                            attachmentKind: 'image',
                            customer,
                          }),
                        });
                      } catch {
                        // Cancelled
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Share Photo via WhatsApp</span>
                  </button>
                )}

                {canCopyImage && (
                  <button
                    type="button"
                    onClick={handleCopyPhoto}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    {imageCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{imageCopied ? 'Copied!' : 'Copy Photo'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Direct WhatsApp chat input */}
            <div className="bg-emerald-900/80 p-2.5 rounded-xl border border-emerald-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-200 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Number:
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-emerald-400">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter customer mobile..."
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-2 py-1.5 text-xs rounded-lg bg-emerald-950 text-white border border-emerald-700 placeholder:text-emerald-500 font-mono font-bold"
                  />
                </div>
                <a
                  href={buildWhatsAppUrl('image')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Printable Order Receipt Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div
            id="printable-order-receipt-area"
            className="p-5 space-y-4 text-xs text-stone-800 font-sans print:p-0 bg-white"
          >
            {/* Shop Header */}
            <div className="text-center pb-3 border-b border-stone-200 space-y-1">
              <span className="text-2xl">🧈</span>
              <h2 className="text-base font-black text-stone-950">{settings.shopName}</h2>
              <p className="text-[11px] text-stone-500">
                Online Pre-Order Receipt • ऑनलाइन घी ऑर्डर पावती
              </p>
              <p className="text-[11px] text-stone-500">
                {order.status === 'ready'
                  ? homePickupAddress
                    ? `Home Pickup: ${homePickupAddress} • Ph: ${settings.phone}`
                    : `Ph: ${settings.phone}`
                  : `${settings.address} • Ph: ${settings.phone}`}
              </p>
            </div>

            {/* Shareable Status Box */}
            <div
              className={`p-3 rounded-xl border-2 text-center space-y-1 ${
                order.status === 'ready'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : order.status === 'delivered'
                  ? 'bg-stone-100 border-stone-300 text-stone-900'
                  : 'bg-sky-50 border-sky-300 text-sky-950'
              }`}
            >
              <div className="text-xs font-black tracking-wide uppercase">
                {order.status === 'ready'
                  ? '📦 ORDER READY FOR PICKUP / घी घर आ गया है'
                  : order.status === 'delivered'
                  ? '✅ DELIVERED & BILLED / डिलीवरी पूर्ण'
                  : '✅ ORDER CONFIRMED / ऑर्डर कन्फर्म हो गया है'}
              </div>
              <p className="text-[11px] opacity-90">
                {order.status === 'ready'
                  ? 'Your Desi Ghee has arrived at our home. Please come & collect your delivery!'
                  : order.status === 'delivered'
                  ? `Order completed${order.completedInvoiceNo ? ` • Final Bill #${order.completedInvoiceNo}` : ''}.`
                  : 'Your order is booked and requested from the shop. We will message you once it arrives!'}
              </p>
              {order.status === 'ready' && homePickupAddress && (
                <p className="text-[11px] font-bold text-emerald-950 pt-0.5">
                  📍 Pickup Address (घर का पता): {homePickupAddress}
                </p>
              )}
            </div>

            {/* Customer & Order Meta */}
            <div className="flex justify-between items-start gap-3 text-[11px] bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-400 block">Customer:</span>
                <span className="font-bold text-stone-900 block">{order.customerName}</span>
                <span className="font-mono text-stone-600">
                  {order.customerPhone ? `Ph: ${order.customerPhone}` : 'Phone not added'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block">Order No:</span>
                <span className="font-mono font-bold text-stone-900 block">{order.orderNo}</span>
                <span className="text-stone-500">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            {/* Ordered Items Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] font-bold uppercase text-stone-500 bg-stone-50">
                  <th className="py-1.5 px-2 text-left" style={{ width: '46%' }}>
                    Ordered Item
                  </th>
                  <th className="py-1.5 px-1.5 text-center" style={{ width: '18%' }}>
                    Qty
                  </th>
                  <th className="py-1.5 px-1.5 text-right" style={{ width: '18%' }}>
                    Rate
                  </th>
                  <th className="py-1.5 px-2 text-right" style={{ width: '18%' }}>
                    Est. Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-stone-100 align-top">
                    <td className="py-2 px-2">
                      <span className="font-semibold text-stone-900 block break-words">
                        {it.productName}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center font-mono whitespace-nowrap">
                      {it.quantityKg.toFixed(3)} kg
                    </td>
                    <td className="py-2 px-1.5 text-right font-mono whitespace-nowrap">
                      ₹{it.ratePerKg}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold whitespace-nowrap">
                      {formatCurrency(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Estimated Total & Khata Adjustments */}
            <div className="space-y-1.5 pt-2 border-t border-stone-200 text-xs">
              <div className="flex justify-between text-stone-700 font-semibold">
                <span>Current Order Amount (आज का ऑर्डर):</span>
                <span className="font-mono">{formatCurrency(currentOrderAmount)}</span>
              </div>
              {previousUdhaar > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span>Previous Pending Udhaar (पिछला बकाया):</span>
                  <span className="font-mono">+{formatCurrency(previousUdhaar)}</span>
                </div>
              )}
              {advanceAdjusted > 0 && (
                <div className="flex justify-between text-teal-700 font-semibold">
                  <span>Advance Adjusted (पुराना एडवांस घटाया):</span>
                  <span className="font-mono">-{formatCurrency(advanceAdjusted)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-stone-950 pt-1.5 border-t border-stone-200">
                <span>
                  {hasKhataAdjustment
                    ? 'Total Payable on Pickup (कुल देय राशि):'
                    : 'Estimated Bill Amount (अनुमानित राशि):'}
                </span>
                <span className="font-mono text-amber-800">{formatCurrency(netPayable)}</span>
              </div>
              {remainingAdvance > 0 && (
                <div className="flex justify-between text-teal-800 font-semibold text-[11px]">
                  <span>Remaining Advance Credit (शेष एडवांस जमा):</span>
                  <span className="font-mono">{formatCurrency(remainingAdvance)}</span>
                </div>
              )}
              {order.notes && order.notes.trim() && (
                <div className="flex justify-between gap-2 text-stone-600 text-[11px] pt-1">
                  <span className="font-semibold text-stone-700 shrink-0">Note:</span>
                  <span className="text-right break-words">{order.notes}</span>
                </div>
              )}
              <p className="text-[10.5px] text-stone-500 pt-1">
                * Final bill &amp; payment (Cash / Online / Khata adjustment) will be settled at the time of delivery pickup.
              </p>
            </div>

            <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Thank you for ordering pure Desi Ghee! • शुद्धता ही हमारी पहचान
            </div>
          </div>
        </div>

        {/* Footer Quick Status & Action Bar */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {onChangeStatus && order.status === 'confirmed' && (
              <button
                type="button"
                onClick={() => onChangeStatus(order.id, 'ready')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Mark Arrived / Ready</span>
              </button>
            )}
            {onChangeStatus && order.status === 'ready' && (
              <button
                type="button"
                onClick={() => onChangeStatus(order.id, 'confirmed')}
                className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Back to Confirmed</span>
              </button>
            )}
            {onDeliverAndBill && order.status !== 'delivered' && (
              <button
                type="button"
                onClick={() => onDeliverAndBill(order)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Deliver &amp; Make Bill</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <a
              href={directMsgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {order.status === 'ready'
                  ? "Send 'Ready' Msg"
                  : order.status === 'confirmed'
                  ? "Send 'Confirm' Msg"
                  : 'Send WhatsApp'}
              </span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
