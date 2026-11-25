import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Send,
  Sparkles,
  CheckCircle,
  Phone,
  Download,
  FileText,
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { BusinessSettings, Sale } from '../types';
import {
  buildSaleWhatsAppMessage,
  formatCurrency,
  formatDateTime,
} from '../utils/formatters';
import {
  downloadElementAsImage,
  downloadElementAsPdf,
  printElement,
  shareElementAsImage,
  shareElementAsPdf,
} from '../utils/printHelper';

interface InvoiceModalProps {
  sale: Sale | null;
  settings: BusinessSettings;
  onClose: () => void;
}

interface MediaPanelState {
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
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, settings, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [mediaResult, setMediaResult] = useState<MediaPanelState | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>(
    sale ? sale.customerPhone.replace(/\D/g, '') : ''
  );

  useEffect(() => {
    setMediaResult(null);
    setImageCopied(false);
    setRecipientPhone(sale ? sale.customerPhone.replace(/\D/g, '') : '');
  }, [sale?.id, sale?.customerPhone]);

  if (!sale) return null;

  const docTitle = `Invoice_${sale.invoiceNo}_${settings.shopName.replace(/\s+/g, '_')}`;

  const previousUdhaar = sale.previousUdhaar || 0;
  const previousUdhaarCleared = sale.previousUdhaarCleared || 0;
  const advanceUsed = sale.advanceUsed || 0;
  const extraAdded = sale.extraPaymentAdded || 0;
  const totalWithPrevious = Math.max(0, sale.totalAmount + previousUdhaar - advanceUsed);
  const totalBalanceDue = Math.max(
    0,
    Math.round((previousUdhaar - previousUdhaarCleared + sale.pendingAmount) * 100) / 100
  );

  const buildWhatsAppUrl = (kind: 'image' | 'pdf', customPhone?: string) => {
    const targetPhone = (customPhone !== undefined ? customPhone : recipientPhone).replace(/\D/g, '');
    const summaryMsg = buildSaleWhatsAppMessage(sale, settings, {
      attachmentKind: kind,
    });

    return targetPhone
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(summaryMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryMsg)}`;
  };

  const handlePrint = () => {
    printElement('printable-invoice-area', `Invoice #${sale.invoiceNo} - ${settings.shopName}`);
  };

  const handleDownloadPhoto = async () => {
    setIsGenerating(true);
    setImageCopied(false);
    try {
      const res = await downloadElementAsImage('printable-invoice-area', `${docTitle}.png`);
      const waUrl = buildWhatsAppUrl('image');
      setMediaResult({
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
        error: res.success ? undefined : res.error || 'Could not download bill photo. Please try Print.',
      });
    } catch (err: any) {
      setMediaResult({
        kind: 'image',
        filename: `${docTitle}.png`,
        whatsappUrl: buildWhatsAppUrl('image'),
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate bill photo. Please try Print.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDirectPdf = async () => {
    setIsGenerating(true);
    setImageCopied(false);
    try {
      const res = await downloadElementAsPdf('printable-invoice-area', `${docTitle}.pdf`);
      const waUrl = buildWhatsAppUrl('pdf');
      setMediaResult({
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
      setMediaResult({
        kind: 'pdf',
        filename: `${docTitle}.pdf`,
        whatsappUrl: buildWhatsAppUrl('pdf'),
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate PDF. Please try Photo or Print.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const msg = buildSaleWhatsAppMessage(sale, settings);

    let cleanPhone = (recipientPhone || sale.customerPhone).replace(/\D/g, '');
    if (!cleanPhone) {
      const promptPhone = window.prompt('Enter WhatsApp mobile number for this message / record:', '');
      if (!promptPhone) return;
      cleanPhone = promptPhone.replace(/\D/g, '');
      setRecipientPhone(cleanPhone);
    }
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsAppPhoto = async (customPhone?: string) => {
    setIsGenerating(true);
    setImageCopied(false);
    setMediaResult(null);

    const filename = `${docTitle}.png`;
    const waUrl = buildWhatsAppUrl('image', customPhone);
    const caption = buildSaleWhatsAppMessage(sale, settings, { attachmentKind: 'image' });

    try {
      const res = await shareElementAsImage('printable-invoice-area', filename, {
        title: `Invoice #${sale.invoiceNo} - ${settings.shopName}`,
        text: caption,
        whatsappFallbackUrl: waUrl,
      });

      setMediaResult({
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
      console.error('Error generating/sharing bill photo:', err);
      setMediaResult({
        kind: 'image',
        filename,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not capture bill photograph. Please try Print.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsAppPdf = async () => {
    setIsGenerating(true);
    setImageCopied(false);
    const filename = `${docTitle}.pdf`;
    const waUrl = buildWhatsAppUrl('pdf');
    const caption = buildSaleWhatsAppMessage(sale, settings, { attachmentKind: 'pdf' });
    try {
      const res = await shareElementAsPdf('printable-invoice-area', filename, {
        title: `Invoice #${sale.invoiceNo} - ${settings.shopName}`,
        text: caption,
        whatsappFallbackUrl: waUrl,
      });
      setMediaResult({
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
      setMediaResult({
        kind: 'pdf',
        filename,
        whatsappUrl: waUrl,
        downloaded: false,
        sharedViaWebShare: false,
        error: err?.message || 'Could not generate PDF.',
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
      console.warn('Copy image to clipboard failed:', err);
    }
  };

  const canCopyImage =
    Boolean(mediaResult?.blob && mediaResult.kind === 'image') &&
    typeof ClipboardItem !== 'undefined' &&
    Boolean(navigator.clipboard?.write);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono bg-stone-800 px-2 py-0.5 rounded text-amber-300">
              #{sale.invoiceNo}
            </span>
            <span className="text-xs text-stone-300 hidden sm:inline truncate max-w-[120px]">
              {sale.customerName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Print Receipt via Printer"
            >
              <Printer className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => handleShareWhatsAppPhoto()}
              disabled={isGenerating}
              className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
              title="WhatsApp Photo: Captures crisp bill photograph to send directly on WhatsApp"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span className="text-[11px]">WhatsApp Photo</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Share formatted WhatsApp text summary"
            >
              <Send className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Msg</span>
            </button>
            <button
              onClick={handleDownloadPhoto}
              disabled={isGenerating}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Download Bill Photograph (PNG)"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-[11px] hidden sm:inline">Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Photo / Download Interaction Panel */}
        {mediaResult && (
          <div
            className={`p-3 sm:p-4 border-b shrink-0 space-y-2.5 max-h-[52vh] overflow-y-auto ${
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
                      ? mediaResult.kind === 'image'
                        ? 'Bill Photo Sent via Share Sheet!'
                        : 'Invoice PDF Sent via Share Sheet!'
                      : mediaResult.downloaded
                      ? mediaResult.kind === 'image'
                        ? 'Bill Photo Ready & Saved!'
                        : 'Invoice PDF Saved to Device!'
                      : mediaResult.kind === 'image'
                      ? 'Bill Photograph Ready!'
                      : 'Invoice PDF Ready!'}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    File: <span className="font-mono font-bold text-white">{mediaResult.filename}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMediaResult(null)}
                className="opacity-80 hover:opacity-100 text-xs p-1 cursor-pointer"
                aria-label="Dismiss panel"
              >
                ✕
              </button>
            </div>

            {/* Crisp Visual Photo Preview (enables long-press Save / Share on mobile) */}
            {mediaResult.dataUrl && !mediaResult.error && (
              <div className="bg-white rounded-xl p-2 border border-emerald-700/60 text-center space-y-1">
                <img
                  src={mediaResult.dataUrl}
                  alt={`Invoice #${sale.invoiceNo} Photograph`}
                  className="max-h-48 w-auto mx-auto rounded-lg object-contain border border-stone-200"
                />
                <p className="text-[10px] text-stone-500">
                  Tip: Long-press the bill photo above on your phone to Save or Share directly.
                </p>
              </div>
            )}

            {/* Direct Save, Copy, Share & PDF Action Row */}
            {!mediaResult.error && (
              <div className="flex flex-wrap items-center gap-2">
                {(mediaResult.blobUrl || mediaResult.dataUrl) && (
                  <a
                    href={mediaResult.blobUrl || mediaResult.dataUrl}
                    download={mediaResult.filename}
                    type={mediaResult.kind === 'image' ? 'image/png' : 'application/pdf'}
                    onClick={() =>
                      setMediaResult((prev) => (prev ? { ...prev, downloaded: true } : prev))
                    }
                    className="px-3 py-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {mediaResult.kind === 'image'
                        ? mediaResult.downloaded
                          ? 'Save Photo Again'
                          : 'Save Photo (PNG)'
                        : mediaResult.downloaded
                        ? 'Download PDF Again'
                        : 'Save PDF to Phone'}
                    </span>
                  </a>
                )}

                {mediaResult.file && mediaResult.canWebShareFiles && (
                  <button
                    onClick={async () => {
                      try {
                        await (navigator as any).share({
                          files: [mediaResult.file],
                          title: `Invoice #${sale.invoiceNo} - ${settings.shopName}`,
                          text: `Invoice #${sale.invoiceNo} - ${settings.shopName}`,
                        });
                        setMediaResult((prev) =>
                          prev ? { ...prev, sharedViaWebShare: true } : prev
                        );
                      } catch {
                        // Cancelled by user
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    {mediaResult.kind === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {mediaResult.kind === 'image'
                        ? 'Share Photo via WhatsApp'
                        : 'Share PDF via WhatsApp'}
                    </span>
                  </button>
                )}

                {canCopyImage && (
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

                {mediaResult.kind === 'image' ? (
                  <button
                    onClick={handleDownloadDirectPdf}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Also download as PDF file if needed"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                ) : (
                  <button
                    onClick={handleShareWhatsAppPdf}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Share PDF</span>
                  </button>
                )}
              </div>
            )}

            {/* Recipient Phone Selector */}
            <div className="bg-emerald-900/80 p-2.5 rounded-xl border border-emerald-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-200 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Open Specific WhatsApp Chat (रिकॉर्ड / ग्राहक):
                </span>
                {sale.customerPhone && (
                  <button
                    onClick={() => setRecipientPhone(sale.customerPhone.replace(/\D/g, ''))}
                    className="text-amber-300 hover:underline text-[10px] cursor-pointer"
                  >
                    Customer&apos;s Number
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-emerald-400">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter mobile number..."
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-2 py-1.5 text-xs rounded-lg bg-emerald-950 text-white border border-emerald-700 placeholder:text-emerald-500 font-mono font-bold"
                  />
                </div>
                <a
                  href={buildWhatsAppUrl(mediaResult.kind)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>
              </div>
              {!mediaResult.sharedViaWebShare && !mediaResult.error && (
                <p className="text-[10px] text-emerald-300 leading-tight">
                  {mediaResult.kind === 'image'
                    ? 'Photo saved! Tap "Open WhatsApp" and attach from Gallery (📎 → Gallery) or paste if you tapped Copy Photo.'
                    : `Tap "Save PDF to Phone" if needed, then "Open WhatsApp" and attach ${mediaResult.filename} (📎 → Document).`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Scrollable wrapper around Printable Receipt Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div
            id="printable-invoice-area"
            className="p-5 space-y-4 text-xs text-stone-800 font-sans print:p-0 bg-white"
          >
            {/* Shop Header */}
            <div className="text-center pb-3 border-b border-stone-200 space-y-1">
              <span className="text-2xl">🧈</span>
              <h2 className="text-base font-black text-stone-950">{settings.shopName}</h2>
              <p className="text-[11px] text-stone-500">
                Pure Desi Ghee & Fresh Dairy Cream • शुद्ध देसी घी विक्रेता
              </p>
              <p className="text-[11px] text-stone-500">
                {settings.address} • Ph: {settings.phone}
              </p>
            </div>

            {/* Customer & Bill meta */}
            <div className="flex justify-between items-start gap-3 text-[11px] bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-400 block">Customer:</span>
                <span className="font-bold text-stone-900 block">{sale.customerName}</span>
                <span className="font-mono text-stone-600">
                  {sale.customerPhone ? `Ph: ${sale.customerPhone}` : 'Walk-in (Cash)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block">Bill No:</span>
                <span className="font-mono font-bold text-stone-900 block">{sale.invoiceNo}</span>
                <span className="text-stone-500">{formatDateTime(sale.date)}</span>
              </div>
            </div>

            {/* Items Table (Clean table layout for crisp PDF alignment) */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] font-bold uppercase text-stone-500 bg-stone-50">
                  <th className="py-1.5 px-2 text-left" style={{ width: '46%' }}>Item</th>
                  <th className="py-1.5 px-1.5 text-center" style={{ width: '18%' }}>Qty</th>
                  <th className="py-1.5 px-1.5 text-right" style={{ width: '18%' }}>Rate</th>
                  <th className="py-1.5 px-2 text-right" style={{ width: '18%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-stone-100 align-top">
                    <td className="py-2 px-2">
                      <span className="font-semibold text-stone-900 block break-words">
                        {it.productName}
                      </span>
                      {(it.isCream || it.testPercentage) && (
                        <span className="text-[10px] text-amber-800 font-mono block mt-0.5">
                          Test: {it.testPercentage || 51}% · 51% Base: ₹{it.baseRate || 335}
                        </span>
                      )}
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

          {/* Totals */}
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(sale.subtotal)}</span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span className="flex items-center gap-1">
                  {settings.loyaltySchemeEnabled !== false && sale.isLoyaltyDiscountApplied ? (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Repeat Scheme Discount ({settings.gheeSchemeDiscountPercent}%):
                    </>
                  ) : (
                    <>
                      Discount ({sale.discountPercent}%):
                    </>
                  )}
                </span>
                <span className="font-mono">- {formatCurrency(sale.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-stone-950 pt-2 border-t border-stone-200">
              <span>{previousUdhaar > 0 ? 'Current Bill Total (आज का बिल):' : 'Grand Total:'}</span>
              <span className="font-mono">{formatCurrency(sale.totalAmount)}</span>
            </div>

            {previousUdhaar > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Previous Pending Udhaar (पिछला बाकी उधार):</span>
                <span className="font-mono">+ {formatCurrency(previousUdhaar)}</span>
              </div>
            )}

            {advanceUsed > 0 && (
              <div className="flex justify-between text-teal-700 font-bold">
                <span>Advance Deducted (पुराना जमा घटाया):</span>
                <span className="font-mono">- {formatCurrency(advanceUsed)}</span>
              </div>
            )}

            {(previousUdhaar > 0 || advanceUsed > 0) && (
              <div className="flex justify-between text-sm font-black text-stone-950 pt-1.5 border-t border-stone-200">
                <span>Total Bill Payable (कुल देय राशि):</span>
                <span className="font-mono">{formatCurrency(totalWithPrevious)}</span>
              </div>
            )}

            {/* Payment Details */}
            <div className="pt-2 border-t border-dashed border-stone-300 space-y-1">
              {sale.cashReceived > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Paid in Cash (गल्ला):</span>
                  <span className="font-mono font-bold">{formatCurrency(sale.cashReceived)}</span>
                </div>
              )}
              {sale.onlineReceived > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Paid Online (बैंक/UPI):</span>
                  <span className="font-mono font-bold">{formatCurrency(sale.onlineReceived)}</span>
                </div>
              )}
              {sale.notes && sale.notes.trim() && (
                <div className="flex justify-between gap-2 text-stone-600 text-[11px] pt-0.5">
                  <span className="font-semibold text-stone-700 shrink-0">Remarks (नोट):</span>
                  <span className="text-right break-words">{sale.notes}</span>
                </div>
              )}

              {extraAdded > 0 ? (
                <div className="mt-2 p-2.5 rounded-xl bg-teal-50 border-2 border-teal-300 text-teal-900 space-y-1">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="flex items-center gap-1 text-teal-800">
                      <span>💰</span>
                      <span>EXTRA SAVED AS ADVANCE (एडवांस जमा):</span>
                    </span>
                    <span className="font-mono text-sm text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                      + {formatCurrency(extraAdded)}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-teal-800 leading-tight">
                    Extra amount of <strong>{formatCurrency(extraAdded)}</strong> has been linked to {sale.customerName}&apos;s Khata and will automatically deduct from their next bill.
                  </p>
                </div>
              ) : totalBalanceDue > 0 ? (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-1">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="flex items-center gap-1 text-rose-700">
                      <span>⚠️</span>
                      <span>
                        {previousUdhaar > 0
                          ? 'TOTAL BALANCE DUE / कुल बकाया राशि:'
                          : 'PAYMENT PENDING / बकाया राशि:'}
                      </span>
                    </span>
                    <span className="font-mono text-sm text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      {formatCurrency(totalBalanceDue)}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-rose-800 leading-tight">
                    {previousUdhaar > 0 ? (
                      <>
                        Total remaining balance is <strong>{formatCurrency(totalBalanceDue)}</strong>
                        {sale.pendingAmount > 0 && previousUdhaar - previousUdhaarCleared > 0
                          ? ` (Current Bill Due: ${formatCurrency(sale.pendingAmount)} + Previous Udhaar Remaining: ${formatCurrency(
                              previousUdhaar - previousUdhaarCleared
                            )})`
                          : ''}
                        . Please clear the pending dues at your earliest convenience.
                      </>
                    ) : (
                      <>
                        This bill has a pending balance of <strong>{formatCurrency(totalBalanceDue)}</strong>. Please clear the pending dues at your earliest convenience.
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="text-center py-1.5 px-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-[11px] mt-2">
                  {previousUdhaarCleared > 0
                    ? `✅ ALL DUES CLEARED (पिछला ₹${previousUdhaarCleared} उधार व आज का बिल पूरा चुकता)`
                    : '✅ FULL PAYMENT RECEIVED • कोई बकाया नहीं'}
                </div>
              )}
            </div>
          </div>

          {/* Scheme Notice Footer - only shown if scheme is enabled in settings and was activated */}
          {settings.loyaltySchemeEnabled !== false && sale.loyaltySchemeActivatedKg && sale.loyaltySchemeActivatedKg > 0 ? (
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-center text-[11px] text-amber-900">
              🌟 <strong>Special Ghee Loyalty Customer!</strong>
              <p className="mt-0.5 text-stone-600">
                You get <strong>{settings.gheeSchemeDiscountPercent}% DISCOUNT</strong> on your next Desi Ghee purchase valid for the next{' '}
                {sale.loyaltySchemeActivatedKg} Month(s)! Keep enjoying pure Desi Ghee.
              </p>
            </div>
          ) : null}

          <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-stone-100">
            Thank you for visiting! Please visit again. • शुद्धता ही हमारी पहचान
          </div>
          </div>
        </div>

        {/* Footer close */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
