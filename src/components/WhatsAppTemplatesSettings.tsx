import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  RotateCcw,
  Check,
  HelpCircle,
  Eye,
  Copy,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';
import { WhatsAppTemplates } from '../types';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  generateWhatsAppMessage,
  substituteVariables,
} from '../utils/formatters';

interface WhatsAppTemplatesSettingsProps {
  templates: WhatsAppTemplates;
  onChangeTemplates: (newTemplates: WhatsAppTemplates) => void;
  shopName: string;
  shopPhone?: string;
}

type TemplateConditionKey = 'fullPaid' | 'pending' | 'receipt';

interface VariableTag {
  tag: string;
  label: string;
  labelHindi: string;
}

const BILL_VARIABLES: VariableTag[] = [
  { tag: '{shopName}', label: 'Shop Name', labelHindi: 'दुकान का नाम' },
  { tag: '{shopPhone}', label: 'Shop Phone', labelHindi: 'फोन / UPI' },
  { tag: '{customerName}', label: 'Customer Name', labelHindi: 'ग्राहक का नाम' },
  { tag: '{invoiceNo}', label: 'Bill No', labelHindi: 'बिल नंबर' },
  { tag: '{dateTime}', label: 'Date & Time', labelHindi: 'दिनांक व समय' },
  { tag: '{itemsSummary}', label: 'Items List', labelHindi: 'सामान विवरण' },
  { tag: '{billBreakdown}', label: 'Full Bill Breakdown', labelHindi: 'पूरा बिल हिसाब' },
  { tag: '{paymentStatusFooter}', label: 'Pending / Advance Status', labelHindi: 'उधार व एडवांस स्थिति' },
  { tag: '{currentBillAmount}', label: 'Current Bill', labelHindi: 'आज का बिल' },
  { tag: '{previousUdhaar}', label: 'Previous Udhaar', labelHindi: 'पिछला उधार' },
  { tag: '{advanceUsed}', label: 'Advance Adjusted', labelHindi: 'एडवांस घटाया' },
  { tag: '{totalAmount}', label: 'Total Bill Payable', labelHindi: 'कुल देय बिल' },
  { tag: '{paidAmount}', label: 'Paid Today', labelHindi: 'आज जमा राशि' },
  { tag: '{pendingAmount}', label: 'Pending Balance', labelHindi: 'बकाया राशि (उधार)' },
  { tag: '{remarks}', label: 'Remarks / Note', labelHindi: 'नोट / टिप्पणी' },
  { tag: '{loyaltySchemeNotice}', label: '5% Scheme Notice', labelHindi: 'स्कीम छूट सूचना' },
];

const RECEIPT_VARIABLES: VariableTag[] = [
  { tag: '{shopName}', label: 'Shop Name', labelHindi: 'दुकान का नाम' },
  { tag: '{shopPhone}', label: 'Shop Phone', labelHindi: 'फोन / UPI' },
  { tag: '{customerName}', label: 'Customer Name', labelHindi: 'ग्राहक का नाम' },
  { tag: '{receiptNo}', label: 'Receipt No', labelHindi: 'रसीद संख्या' },
  { tag: '{dateTime}', label: 'Date & Time', labelHindi: 'दिनांक व समय' },
  { tag: '{amountReceived}', label: 'Amount Received', labelHindi: 'प्राप्त राशि' },
  { tag: '{paymentMode}', label: 'Payment Mode', labelHindi: 'माध्यम (Cash/UPI)' },
  { tag: '{previousBalance}', label: 'Previous Balance', labelHindi: 'पिछला बकाया' },
  { tag: '{remainingBalance}', label: 'Remaining Balance', labelHindi: 'शेष बकाया' },
  { tag: '{note}', label: 'Payment Note', labelHindi: 'टिप्पणी / नोट' },
];

export const WhatsAppTemplatesSettings: React.FC<WhatsAppTemplatesSettingsProps> = ({
  templates,
  onChangeTemplates,
  shopName,
  shopPhone = '9876543210',
}) => {
  const [activeTab, setActiveTab] = useState<TemplateConditionKey>('fullPaid');
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [confirmReset, setConfirmReset] = useState<'current' | 'all' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fallback defaults in case templates object is partially undefined
  const currentTemplates: WhatsAppTemplates = {
    fullPaidBillTemplate:
      templates?.fullPaidBillTemplate || DEFAULT_WHATSAPP_TEMPLATES.fullPaidBillTemplate,
    pendingBillTemplate:
      templates?.pendingBillTemplate || DEFAULT_WHATSAPP_TEMPLATES.pendingBillTemplate,
    paymentConfirmationTemplate:
      templates?.paymentConfirmationTemplate ||
      DEFAULT_WHATSAPP_TEMPLATES.paymentConfirmationTemplate,
  };

  const handleUpdateCurrentField = (newText: string) => {
    if (activeTab === 'fullPaid') {
      onChangeTemplates({
        ...currentTemplates,
        fullPaidBillTemplate: newText,
      });
    } else if (activeTab === 'pending') {
      onChangeTemplates({
        ...currentTemplates,
        pendingBillTemplate: newText,
      });
    } else {
      onChangeTemplates({
        ...currentTemplates,
        paymentConfirmationTemplate: newText,
      });
    }
  };

  const executeResetCurrent = () => {
    if (activeTab === 'fullPaid') {
      onChangeTemplates({
        ...currentTemplates,
        fullPaidBillTemplate: DEFAULT_WHATSAPP_TEMPLATES.fullPaidBillTemplate,
      });
    } else if (activeTab === 'pending') {
      onChangeTemplates({
        ...currentTemplates,
        pendingBillTemplate: DEFAULT_WHATSAPP_TEMPLATES.pendingBillTemplate,
      });
    } else {
      onChangeTemplates({
        ...currentTemplates,
        paymentConfirmationTemplate: DEFAULT_WHATSAPP_TEMPLATES.paymentConfirmationTemplate,
      });
    }
    setConfirmReset(null);
  };

  const executeResetAll = () => {
    onChangeTemplates({
      ...DEFAULT_WHATSAPP_TEMPLATES,
    });
    setConfirmReset(null);
  };

  // Insert a tag at cursor position inside the active textarea
  const handleInsertTag = (tag: string) => {
    const el = textareaRef.current;
    const currentText =
      activeTab === 'fullPaid'
        ? currentTemplates.fullPaidBillTemplate
        : activeTab === 'pending'
        ? currentTemplates.pendingBillTemplate
        : currentTemplates.paymentConfirmationTemplate;

    if (!el) {
      handleUpdateCurrentField(currentText + ' ' + tag);
      return;
    }

    const start = el.selectionStart ?? currentText.length;
    const end = el.selectionEnd ?? currentText.length;
    const updated = currentText.substring(0, start) + tag + currentText.substring(end);
    handleUpdateCurrentField(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Compute live preview text with realistic sample data
  const getPreviewText = (): string => {
    if (activeTab === 'fullPaid') {
      return generateWhatsAppMessage({
        shopName: shopName || 'Shri Krishna Desi Ghee Bhandar',
        customerName: 'Ramesh Sharma',
        invoiceNo: 'INV-2026-0042',
        dateTime: '18 Nov, 02:30 PM',
        itemsSummary: '• Pure Desi Cow Ghee: 2.000 kg × ₹680 = ₹1,360',
        subtotal: 1360,
        totalAmount: 1360,
        advanceUsed: 300,
        paidAmount: 1060,
        cashReceived: 1060,
        pendingAmount: 0,
        notes: 'Tin packed',
        shopPhone: shopPhone || '9876543210',
        loyaltyActive: true,
        loyaltyExpiry: '14/01/2027',
        customTemplate: currentTemplates.fullPaidBillTemplate,
      });
    } else if (activeTab === 'pending') {
      return generateWhatsAppMessage({
        shopName: shopName || 'Shri Krishna Desi Ghee Bhandar',
        customerName: 'Mukesh Verma (Halwai)',
        invoiceNo: 'INV-2026-0043',
        dateTime: '18 Nov, 02:30 PM',
        itemsSummary:
          '• Bilona Buffalo Desi Ghee: 5.000 kg × ₹740 = ₹3,700\n• Fresh Dairy Butter: 1.000 kg × ₹520 = ₹520',
        subtotal: 4220,
        totalAmount: 4220,
        previousUdhaar: 500,
        previousUdhaarCleared: 500,
        paidAmount: 2000,
        onlineReceived: 2000,
        pendingAmount: 2720,
        currentBillDue: 2720,
        notes: 'Remaining balance next week',
        shopPhone: shopPhone || '9876543210',
        loyaltyActive: true,
        loyaltyExpiry: '14/02/2027',
        customTemplate: currentTemplates.pendingBillTemplate,
      });
    } else {
      return substituteVariables(currentTemplates.paymentConfirmationTemplate, {
        shopName: shopName || 'Shri Krishna Desi Ghee Bhandar',
        customerName: 'Mukesh Verma (Halwai)',
        receiptNo: 'PAY-892144',
        dateTime: '14/09/2026, 02:30 PM',
        amountReceived: '2,000',
        paymentMode: '📱 Online / UPI (ऑनलाइन)',
        previousBalance: '4,220',
        remainingBalance: '₹2,220',
        note: 'GPay payment received',
        shopPhone: shopPhone || '9876543210',
      });
    }
  };

  const previewText = getPreviewText();

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewText);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  // WhatsApp simple markdown formatting renderer for the live bubble preview
  const renderFormattedPreview = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Replace *bold* with <strong>
      const formattedLine = line.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      return (
        <span
          key={idx}
          className="block min-h-[1.2em]"
          dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
        />
      );
    });
  };

  const currentVal =
    activeTab === 'fullPaid'
      ? currentTemplates.fullPaidBillTemplate
      : activeTab === 'pending'
      ? currentTemplates.pendingBillTemplate
      : currentTemplates.paymentConfirmationTemplate;

  const currentVars = activeTab === 'receipt' ? RECEIPT_VARIABLES : BILL_VARIABLES;

  return (
    <div className="space-y-4 text-xs text-stone-800">
      {/* Intro Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
            <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Customizable WhatsApp Message Formats (व्हाट्सएप संदेश प्रारूप)</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Manage your own WhatsApp messages for all 3 situations. You can customize text, add your own Hindi/English greetings, and click tags like <code className="bg-emerald-100 px-1 py-0.2 rounded font-mono font-bold text-emerald-900">{'{totalAmount}'}</code> to insert dynamic values.
          </p>
        </div>
        {confirmReset === 'all' ? (
          <div className="shrink-0 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
            <span className="text-[10.5px] text-rose-800 font-bold">Reset all 3?</span>
            <button
              type="button"
              onClick={executeResetAll}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(null)}
              className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-600 text-[10px] hover:bg-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset('all')}
            className="shrink-0 px-2.5 py-1 text-[10.5px] rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1 font-medium cursor-pointer"
            title="Reset all 3 formats to original defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Defaults</span>
          </button>
        )}
      </div>

      {/* Condition Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('fullPaid')}
          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeTab === 'fullPaid'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs">1. Full Paid Bill</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                activeTab === 'fullPaid'
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              पूर्ण भुगतान
            </span>
          </div>
          <p
            className={`text-[10px] leading-tight ${
              activeTab === 'fullPaid' ? 'text-emerald-100' : 'text-stone-500'
            }`}
          >
            Sent when customer pays bill fully (Pending Balance = ₹0)
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs">2. Due / Partial Bill</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                activeTab === 'pending'
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              बकाया सूचना
            </span>
          </div>
          <p
            className={`text-[10px] leading-tight ${
              activeTab === 'pending' ? 'text-amber-100' : 'text-stone-500'
            }`}
          >
            Sent when bill is unpaid or partial (Pending Balance &gt; ₹0)
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipt')}
          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeTab === 'receipt'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs">3. Payment Confirmation</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                activeTab === 'receipt'
                  ? 'bg-indigo-800 text-indigo-100'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              भुगतान पावती
            </span>
          </div>
          <p
            className={`text-[10px] leading-tight ${
              activeTab === 'receipt' ? 'text-indigo-100' : 'text-stone-500'
            }`}
          >
            Sent when collecting Udhaar payment in Customer Khata
          </p>
        </button>
      </div>

      {/* Editor & Tags Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Textarea & Click-to-insert tags */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <span>Message Template Text</span>
              <span className="text-[10px] text-stone-500 font-normal">
                (Use *text* for bold in WhatsApp)
              </span>
            </label>
            {confirmReset === 'current' ? (
              <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg">
                <span className="text-[10.5px] text-amber-900 font-bold">Reset this format?</span>
                <button
                  type="button"
                  onClick={executeResetCurrent}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(null)}
                  className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-600 text-[10px] hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset('current')}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Restore original default format for this condition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset this format</span>
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            rows={12}
            value={currentVal}
            onChange={(e) => handleUpdateCurrentField(e.target.value)}
            className="w-full p-3 font-mono text-xs text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs leading-relaxed"
            placeholder="Type your custom WhatsApp message here..."
          />

          {/* Click to insert tag chips */}
          <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-stone-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Click to insert variable tags (टैग जोड़ने के लिए क्लिक करें):</span>
              </span>
              <span className="text-[9.5px] text-stone-400">Inserts at cursor</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-0.5">
              {currentVars.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertTag(v.tag)}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 active:scale-95 text-stone-700 hover:text-emerald-900 text-[10.5px] font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title={`${v.label} • ${v.labelHindi}`}
                >
                  <span className="font-bold text-emerald-700">+</span>
                  <span className="font-bold">{v.tag}</span>
                  <span className="text-stone-400 text-[9.5px] font-sans">({v.labelHindi})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Bubble Preview */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between pb-1.5 mb-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-600" />
              <span className="font-bold text-stone-900 text-xs">Live WhatsApp Preview</span>
            </div>
            <button
              type="button"
              onClick={handleCopyPreview}
              className="text-[10.5px] text-stone-600 hover:text-stone-900 flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
              title="Copy preview text to clipboard"
            >
              {copiedPreview ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Chat Container */}
          <div className="flex-1 rounded-2xl bg-[#eae6df] p-3 border border-stone-300 flex flex-col justify-start overflow-hidden min-h-[300px] shadow-inner">
            <div className="text-[10px] text-stone-500 font-medium text-center py-1 mb-2 bg-[#fdfaf5]/70 rounded-full w-fit mx-auto px-3 shadow-2xs">
              TODAY • CUSTOMER CHAT
            </div>

            {/* WhatsApp Greenish Chat Bubble */}
            <div className="bg-[#d9fdd3] text-[#111b21] p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs font-sans max-w-full space-y-0.5 leading-snug border border-[#b2e5a7]/50 relative">
              <div className="whitespace-pre-wrap break-words text-[11.5px]">
                {renderFormattedPreview(previewText)}
              </div>
              <div className="text-[9.5px] text-stone-500 text-right font-mono pt-1 flex items-center justify-end gap-1">
                <span>02:30 PM</span>
                <span className="text-sky-600 font-bold">✓✓</span>
              </div>
            </div>

            <div className="mt-auto pt-3 text-center">
              <span className="text-[10px] text-stone-500 bg-white/60 px-2 py-0.5 rounded-full">
                Preview with sample data • Real data replaces tags automatically
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
