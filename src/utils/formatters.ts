export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatWeight(kg: number): string {
  if (isNaN(kg)) return '0.000 kg';
  return `${kg.toFixed(3)} kg`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

import { BusinessSettings, Customer, OnlineOrder, Sale, WhatsAppTemplates } from '../types';

export const LEGACY_FULL_PAID_BILL_TEMPLATE = `🙏 *{shopName}* 🙏
🧾 *Bill No:* {invoiceNo}
👤 *Customer:* {customerName}

📦 *Items:* {itemsSummary}
💰 *Total Bill Amount:* ₹{totalAmount}
💵 *Amount Paid Today:* ₹{paidAmount}

✅ *Payment Status:* FULLY PAID / पूरा भुगतान प्राप्त (कोई बकाया नहीं)
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
शुद्ध देसी घी के लिए धन्यवाद!`;

export const LEGACY_PENDING_BILL_TEMPLATE = `🙏 *{shopName}* 🙏
🧾 *Bill No:* {invoiceNo}
👤 *Customer:* {customerName}

📦 *Items:* {itemsSummary}
💰 *Total Bill Amount:* ₹{totalAmount}
💵 *Amount Paid Today:* ₹{paidAmount}

🚨 *PAYMENT PENDING INTIMATION / बकाया बिल सूचना* 🚨
⚠️ *AMOUNT DUE (बकाया राशि):* ₹{pendingAmount}
📌 *Status:* Unpaid / Partial Payment (उधार)
कृपया अपनी बकाया राशि ₹{pendingAmount} का भुगतान जल्द से जल्द करें।
UPI / Phone: {shopPhone}
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
शुद्ध देसी घी के लिए धन्यवाद!`;

export const LEGACY_V2_BILL_TEMPLATE = `🧈 *{shopName}*
🧾 *Bill No:* {invoiceNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Items:*
{itemsSummary}

{billBreakdown}

{paymentStatusFooter}
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
शुद्ध देसी घी के लिए धन्यवाद!`;

export const LEGACY_V3_BILL_TEMPLATE = `🙏 *{shopName}* 🙏
🧾 *Bill No:* {invoiceNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Items:*
{itemsSummary}

{billBreakdown}

{paymentStatusFooter}
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
शुद्ध देसी घी के लिए धन्यवाद!`;

export const LEGACY_V3_PAYMENT_CONFIRMATION_TEMPLATE = `🙏 *{shopName}* 🙏
*भुगतान पावती / PAYMENT CONFIRMATION* ✅

नमस्ते *{customerName}* जी,
आपका भुगतान सफलतापूर्वक प्राप्त हो गया है।

💵 *Amount Received (प्राप्त राशि):* ₹{amountReceived}
💳 *Payment Mode:* {paymentMode}
📅 *Date & Time:* {dateTime}
🧾 *Receipt No:* {receiptNo}
📝 *Note:* {note}

-----------------------------------
📊 *Account Summary (खाता स्थिति):*
• Previous Balance (पिछला बकाया): ₹{previousBalance}
• Paid Amount (जमा किया): -₹{amountReceived}
• Remaining Balance (शेष बकाया): ₹{remainingBalance}
-----------------------------------

समय पर भुगतान के लिए आपका बहुत-बहुत धन्यवाद! 🙏
*{shopName}* • Ph: {shopPhone}`;

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplates = {
  fullPaidBillTemplate: `🙏 *{shopName}* 🙏
🧾 *Bill No:* {invoiceNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Items:*
{itemsSummary}

{billBreakdown}

{paymentStatusFooter}
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
आपका दिन शुभ हो।`,

  pendingBillTemplate: `🙏 *{shopName}* 🙏
🧾 *Bill No:* {invoiceNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Items:*
{itemsSummary}

{billBreakdown}

{paymentStatusFooter}
{loyaltySchemeNotice}
Thank you for choosing our pure Desi Ghee! 🧈
आपका दिन शुभ हो।`,

  paymentConfirmationTemplate: `🙏 *{shopName}* 🙏
*भुगतान पावती / PAYMENT CONFIRMATION* ✅

नमस्ते *{customerName}* जी,
आपका भुगतान सफलतापूर्वक प्राप्त हो गया है।

💵 *Amount Received (प्राप्त राशि):* ₹{amountReceived}
💳 *Payment Mode:* {paymentMode}
📅 *Date & Time:* {dateTime}
🧾 *Receipt No:* {receiptNo}
📝 *Note:* {note}

-----------------------------------
📊 *Account Summary (खाता स्थिति):*
• Previous Balance (पिछला बकाया): ₹{previousBalance}
• Paid Amount (जमा किया): -₹{amountReceived}
• Remaining Balance (शेष बकाया): ₹{remainingBalance}
-----------------------------------

*{shopName}* • Ph: {shopPhone}
आपका दिन शुभ हो।`,

  onlineOrderConfirmedTemplate: `🙏 *{shopName}* 🙏
✅ *ONLINE ORDER CONFIRMED / ऑर्डर कन्फर्म* 📦
🧾 *Order No:* {orderNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Ordered Items:*
{itemsSummary}

{orderBreakdown}
📌 *Status:* Order Confirmed (ऑर्डर बुक हो गया है)
नमस्ते *{customerName}* जी, आपका ऑर्डर कन्फर्म हो गया है। जैसे ही घी घर पर आ जाएगा, हम आपको संदेश भेज देंगे। 🙏
📞 Contact: {shopPhone}

Thank you for choosing our pure Desi Ghee! 🧈
आपका दिन शुभ हो।`,

  onlineOrderReadyTemplate: `🙏 *{shopName}* 🙏
🎉 *ORDER READY FOR PICKUP / घी आ गया है!* 📦
🧾 *Order No:* {orderNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Ordered Items:*
{itemsSummary}

{orderBreakdown}
🏠 *Status:* Ready at Home (घर पर डिलीवरी तैयार है)
नमस्ते *{customerName}* जी, आपका शुद्ध देसी घी आ चुका है! कृपया आकर अपनी डिलीवरी ले जाएं। 🙏
कृपया खुले पैसे लेकर आएं।
{pickupAddressLine}

Thank you for choosing our pure Desi Ghee! 🧈
आपका दिन शुभ हो।`,
};

export const LEGACY_V1_ONLINE_ORDER_READY_TEMPLATE = `🙏 *{shopName}* 🙏
🎉 *ORDER READY FOR PICKUP / घी आ गया है!* 📦
🧾 *Order No:* {orderNo} • 📅 {dateTime}
👤 *Customer:* {customerName}

📦 *Ordered Items:*
{itemsSummary}

{orderBreakdown}
🏠 *Status:* Ready at Home (घर पर डिलीवरी तैयार है)
नमस्ते *{customerName}* जी, आपका शुद्ध देसी घी आ चुका है! कृपया आकर अपनी डिलीवरी ले जाएं। 🙏
{pickupAddressLine}

Thank you for choosing our pure Desi Ghee! 🧈
आपका दिन शुभ हो।`;

export function substituteVariables(
  template: string,
  vars: Record<string, string | number | undefined | null>
): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, val !== undefined && val !== null ? String(val) : '');
  }
  // Clean up any double blank lines caused by empty optional fields
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

export function generateWhatsAppMessage({
  shopName,
  customerName,
  invoiceNo,
  dateTime,
  itemsSummary,
  subtotal,
  discountPercent,
  discountAmount,
  totalAmount,
  paidAmount,
  cashReceived,
  onlineReceived,
  pendingAmount,
  currentBillDue,
  previousUdhaar,
  previousUdhaarCleared,
  advanceUsed,
  extraPaymentAdded,
  notes,
  loyaltyActive,
  loyaltyExpiry,
  shopPhone,
  customTemplate,
  templates,
}: {
  shopName: string;
  customerName: string;
  invoiceNo: string;
  dateTime?: string;
  itemsSummary: string;
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount: number;
  cashReceived?: number;
  onlineReceived?: number;
  pendingAmount: number;
  currentBillDue?: number;
  previousUdhaar?: number;
  previousUdhaarCleared?: number;
  advanceUsed?: number;
  extraPaymentAdded?: number;
  notes?: string;
  loyaltyActive?: boolean;
  loyaltyExpiry?: string;
  shopPhone?: string;
  customTemplate?: string;
  templates?: Partial<WhatsAppTemplates>;
}): string {
  const isPending = pendingAmount > 0;
  const prevUdhaarVal = previousUdhaar || 0;
  const prevClearedVal = previousUdhaarCleared || 0;
  const advanceUsedVal = advanceUsed || 0;
  const extraAddedVal = extraPaymentAdded || 0;
  const currentBillDueVal = currentBillDue !== undefined ? currentBillDue : pendingAmount;
  const totalWithPrevious = Math.max(0, totalAmount + prevUdhaarVal - advanceUsedVal);

  // Choose template: customTemplate > templates[key] > DEFAULT (auto-upgrade unmodified older defaults)
  let templateToUse = customTemplate;
  if (!templateToUse) {
    if (isPending) {
      const candidate = templates?.pendingBillTemplate?.trim();
      const isLegacy =
        !candidate ||
        candidate === LEGACY_PENDING_BILL_TEMPLATE.trim() ||
        candidate === LEGACY_V2_BILL_TEMPLATE.trim() ||
        candidate === LEGACY_V3_BILL_TEMPLATE.trim();
      templateToUse = isLegacy
        ? DEFAULT_WHATSAPP_TEMPLATES.pendingBillTemplate
        : templates!.pendingBillTemplate!;
    } else {
      const candidate = templates?.fullPaidBillTemplate?.trim();
      const isLegacy =
        !candidate ||
        candidate === LEGACY_FULL_PAID_BILL_TEMPLATE.trim() ||
        candidate === LEGACY_V2_BILL_TEMPLATE.trim() ||
        candidate === LEGACY_V3_BILL_TEMPLATE.trim();
      templateToUse = isLegacy
        ? DEFAULT_WHATSAPP_TEMPLATES.fullPaidBillTemplate
        : templates!.fullPaidBillTemplate!;
    }
  }

  // 1. Current Bill, 2. Previous Pending or Advance Adjustments, 3. Total Bill & Amount Paid, 4. Remarks
  const breakdownLines: string[] = ['-----------------------------------'];
  if (discountAmount && discountAmount > 0 && subtotal !== undefined) {
    breakdownLines.push(`📋 *Subtotal:* ₹${Math.round(subtotal).toLocaleString('en-IN')}`);
    breakdownLines.push(
      `🎁 *Discount${discountPercent ? ` (${discountPercent}%)` : ''}:* -₹${Math.round(discountAmount).toLocaleString('en-IN')}`
    );
  }
  breakdownLines.push(
    `🧾 *Current Bill (आज का बिल):* ₹${Math.round(totalAmount).toLocaleString('en-IN')}`
  );
  if (prevUdhaarVal > 0) {
    breakdownLines.push(
      `⚠️ *Previous Pending Udhaar (पिछला बकाया):* +₹${Math.round(prevUdhaarVal).toLocaleString('en-IN')}`
    );
  }
  if (advanceUsedVal > 0) {
    breakdownLines.push(
      `✨ *Advance Adjusted (पुराना एडवांस घटाया):* -₹${Math.round(advanceUsedVal).toLocaleString('en-IN')}`
    );
  }
  breakdownLines.push(
    `💰 *Total Bill Amount (कुल देय राशि):* ₹${Math.round(totalWithPrevious).toLocaleString('en-IN')}`
  );

  // Paid breakdown
  let modeDetail = '';
  const cashVal = cashReceived || 0;
  const onlineVal = onlineReceived || 0;
  if (paidAmount > 0) {
    if (cashVal > 0 && onlineVal > 0) {
      modeDetail = ` (Cash: ₹${Math.round(cashVal).toLocaleString('en-IN')} + Online: ₹${Math.round(onlineVal).toLocaleString('en-IN')})`;
    } else if (onlineVal > 0) {
      modeDetail = ' (Online/UPI)';
    } else if (cashVal > 0) {
      modeDetail = ' (Cash)';
    }
  } else {
    modeDetail = ' (Unpaid)';
  }
  breakdownLines.push(
    `💵 *Amount Paid Today (आज जमा राशि):* ₹${Math.round(paidAmount).toLocaleString('en-IN')}${modeDetail}`
  );

  if (notes && notes.trim()) {
    breakdownLines.push(`📝 *Remarks / Note:* ${notes.trim()}`);
  }
  breakdownLines.push('-----------------------------------');
  const billBreakdown = breakdownLines.join('\n');

  // Final status at the end: Advance Saved / Pending Payment / Full Paid (restored attractive emojis!)
  const statusLines: string[] = [];
  if (extraAddedVal > 0) {
    statusLines.push(`✅ *Payment Status:* FULLY PAID / पूरा भुगतान प्राप्त (कोई बकाया नहीं)`);
    statusLines.push(
      `💰 *EXTRA PAID → SAVED AS ADVANCE (एडवांस जमा):* +₹${Math.round(extraAddedVal).toLocaleString('en-IN')}`
    );
    statusLines.push(
      `✨ Linked to your Khata — ₹${Math.round(extraAddedVal).toLocaleString('en-IN')} will automatically deduct from your next bill!`
    );
  } else if (pendingAmount > 0) {
    statusLines.push(`🚨 *PAYMENT PENDING INTIMATION / बकाया बिल सूचना* 🚨`);
    statusLines.push(
      `⚠️ *${prevUdhaarVal > 0 ? 'TOTAL AMOUNT DUE (कुल बकाया राशि)' : 'AMOUNT DUE (बकाया राशि)'}:* ₹${Math.round(pendingAmount).toLocaleString('en-IN')}`
    );
    if (prevUdhaarVal > 0) {
      const remPrevUdhaar = Math.max(0, prevUdhaarVal - prevClearedVal);
      if (currentBillDueVal > 0 && remPrevUdhaar > 0) {
        statusLines.push(
          `📌 *Breakdown:* Current Bill Due ₹${Math.round(currentBillDueVal).toLocaleString('en-IN')} + Prev. Udhaar Due ₹${Math.round(remPrevUdhaar).toLocaleString('en-IN')}`
        );
      } else if (prevClearedVal > 0 && currentBillDueVal > 0) {
        statusLines.push(
          `📌 *Breakdown:* Current Bill Due ₹${Math.round(currentBillDueVal).toLocaleString('en-IN')} (Prev. Udhaar ₹${Math.round(prevClearedVal).toLocaleString('en-IN')} Cleared)`
        );
      }
    }
    statusLines.push(`📌 *Status:* Unpaid / Partial Payment (उधार)`);
    if (shopPhone) {
      statusLines.push(`UPI / Phone: ${shopPhone}`);
    }
  } else {
    if (prevClearedVal > 0) {
      statusLines.push(`✅ *Payment Status:* ALL DUES CLEARED / पूरा हिसाब चुकता 🎉`);
      statusLines.push(
        `📌 Previous Udhaar ₹${Math.round(prevClearedVal).toLocaleString('en-IN')} + Today's Bill Paid in Full (कोई बकाया नहीं)`
      );
    } else if (advanceUsedVal > 0) {
      statusLines.push(`✅ *Payment Status:* FULLY PAID / पूरा भुगतान प्राप्त (कोई बकाया नहीं)`);
      statusLines.push(
        `✨ Settled using ₹${Math.round(advanceUsedVal).toLocaleString('en-IN')} Advance Credit`
      );
    } else {
      statusLines.push(`✅ *Payment Status:* FULLY PAID / पूरा भुगतान प्राप्त (कोई बकाया नहीं)`);
    }
  }
  const paymentStatusFooter = statusLines.join('\n');

  const loyaltySchemeNotice =
    loyaltyActive && loyaltyExpiry
      ? `\n🌟 *Ghee Discount Scheme Active!*\nYou have 5% OFF valid till: *${loyaltyExpiry}* on your next Ghee purchase.\n`
      : '';

  const hasStructuredPlaceholders =
    templateToUse.includes('{billBreakdown}') ||
    templateToUse.includes('{paymentStatusFooter}');

  let message = substituteVariables(templateToUse, {
    shopName,
    customerName,
    invoiceNo,
    dateTime: dateTime || '',
    itemsSummary,
    currentBillAmount: Math.round(totalAmount).toLocaleString('en-IN'),
    totalAmount: Math.round(totalWithPrevious).toLocaleString('en-IN'),
    paidAmount: Math.round(paidAmount).toLocaleString('en-IN'),
    pendingAmount: Math.round(pendingAmount).toLocaleString('en-IN'),
    previousUdhaar: Math.round(prevUdhaarVal).toLocaleString('en-IN'),
    advanceUsed: Math.round(advanceUsedVal).toLocaleString('en-IN'),
    extraPaymentAdded: Math.round(extraAddedVal).toLocaleString('en-IN'),
    remarks: notes?.trim() || '',
    billBreakdown,
    paymentStatusFooter,
    shopPhone: shopPhone || '',
    loyaltySchemeNotice,
  });

  // Fallback for user-customized templates that don't include {billBreakdown}
  if (!hasStructuredPlaceholders) {
    const extraLines: string[] = [];
    if (prevUdhaarVal > 0) {
      extraLines.push(
        `📌 *Previous Udhaar Added:* +₹${Math.round(prevUdhaarVal).toLocaleString('en-IN')}`
      );
    }
    if (advanceUsedVal > 0) {
      extraLines.push(
        `💎 *Advance Deducted:* -₹${Math.round(advanceUsedVal).toLocaleString('en-IN')}`
      );
    }
    if (notes && notes.trim()) {
      extraLines.push(`📝 *Remarks:* ${notes.trim()}`);
    }
    if (extraAddedVal > 0) {
      extraLines.push(
        `💰 *Extra Paid Saved as Advance:* +₹${Math.round(extraAddedVal).toLocaleString('en-IN')}`
      );
    }
    if (extraLines.length > 0) {
      message += `\n\n${extraLines.join('\n')}`;
    }
  }

  return message;
}

export function buildSaleWhatsAppMessage(
  sale: Sale,
  settings: BusinessSettings,
  options?: {
    attachmentKind?: 'image' | 'pdf';
    loyaltyExpiry?: string;
  }
): string {
  const itemsSummary = sale.items
    .map((it) => {
      const testTag =
        it.isCream || it.testPercentage ? ` [Test ${it.testPercentage || 51}%]` : '';
      return `• ${it.productName}${testTag}: ${it.quantityKg.toFixed(3)} kg × ₹${it.ratePerKg} = ₹${Math.round(it.total).toLocaleString('en-IN')}`;
    })
    .join('\n');

  const previousUdhaar = sale.previousUdhaar || 0;
  const previousUdhaarCleared = sale.previousUdhaarCleared || 0;
  const advanceUsed = sale.advanceUsed || 0;
  const extraPaymentAdded = sale.extraPaymentAdded || 0;
  const totalBalanceDue = Math.max(
    0,
    Math.round((previousUdhaar - previousUdhaarCleared + sale.pendingAmount) * 100) / 100
  );
  const isSchemeActive = settings.loyaltySchemeEnabled !== false;

  let msg = generateWhatsAppMessage({
    shopName: settings.shopName,
    customerName: sale.customerName,
    invoiceNo: sale.invoiceNo,
    dateTime: formatDateTime(sale.date),
    itemsSummary,
    subtotal: sale.subtotal,
    discountPercent: sale.discountPercent,
    discountAmount: sale.discountAmount,
    totalAmount: sale.totalAmount,
    paidAmount: sale.cashReceived + sale.onlineReceived,
    cashReceived: sale.cashReceived,
    onlineReceived: sale.onlineReceived,
    pendingAmount: totalBalanceDue,
    currentBillDue: sale.pendingAmount,
    previousUdhaar,
    previousUdhaarCleared,
    advanceUsed,
    extraPaymentAdded,
    notes: sale.notes,
    loyaltyActive: isSchemeActive && sale.isLoyaltyDiscountApplied,
    loyaltyExpiry: options?.loyaltyExpiry,
    shopPhone: settings.phone,
    templates: settings.whatsAppTemplates,
  });

  if (options?.attachmentKind) {
    const attachNote = `📎 _${
      options.attachmentKind === 'image'
        ? 'Bill photograph'
        : 'Official Invoice PDF'
    } attached for your records._`;
    const closingLine = 'आपका दिन शुभ हो।';
    if (msg.trimEnd().endsWith(closingLine)) {
      const idx = msg.lastIndexOf(closingLine);
      msg = `${msg.slice(0, idx).trimEnd()}\n\n${attachNote}\n${closingLine}`;
    } else {
      msg += `\n\n${attachNote}`;
    }
  }

  return msg;
}

export function generatePaymentReceiptWhatsAppMessage({
  shopName,
  shopPhone,
  customerName,
  receiptNo,
  date,
  amountReceived,
  paymentMode,
  previousBalance,
  remainingBalance,
  advanceAdded,
  remainingAdvance,
  note,
  customTemplate,
  template,
}: {
  shopName: string;
  shopPhone?: string;
  customerName: string;
  receiptNo?: string;
  date: string;
  amountReceived: number;
  paymentMode: 'cash' | 'online';
  previousBalance: number;
  remainingBalance: number;
  advanceAdded?: number;
  remainingAdvance?: number;
  note?: string;
  customTemplate?: string;
  template?: string;
}): string {
  const rawTpl = customTemplate?.trim() || template?.trim();
  const templateToUse =
    !rawTpl || rawTpl === LEGACY_V3_PAYMENT_CONFIRMATION_TEMPLATE.trim()
      ? DEFAULT_WHATSAPP_TEMPLATES.paymentConfirmationTemplate
      : rawTpl;

  const paymentModeStr =
    paymentMode === 'cash' ? '💵 Cash (नकद)' : '📱 Online / UPI (ऑनलाइन)';

  const remainingBalanceStr =
    remainingBalance > 0
      ? `₹${remainingBalance.toLocaleString('en-IN')}`
      : '₹0 (खाता पूर्ण चुकता / All Cleared)';

  let message = substituteVariables(templateToUse, {
    shopName,
    shopPhone: shopPhone || '',
    customerName,
    receiptNo: receiptNo || '',
    dateTime: formatDateTime(date),
    amountReceived: amountReceived.toLocaleString('en-IN'),
    paymentMode: paymentModeStr,
    previousBalance: previousBalance.toLocaleString('en-IN'),
    remainingBalance: remainingBalanceStr,
    note: note || '',
  });

  if ((advanceAdded && advanceAdded > 0) || (remainingAdvance && remainingAdvance > 0)) {
    const extraLines: string[] = [];
    if (advanceAdded && advanceAdded > 0) {
      extraLines.push(`💰 *Extra Paid / Advance Saved:* +₹${advanceAdded.toLocaleString('en-IN')}`);
    }
    if (remainingAdvance && remainingAdvance > 0) {
      extraLines.push(`🏦 *Total Advance Credit Available (अगले बिल में घटेगा):* ₹${remainingAdvance.toLocaleString('en-IN')}`);
    }
    const closingLine = 'आपका दिन शुभ हो।';
    if (message.trimEnd().endsWith(closingLine)) {
      const idx = message.lastIndexOf(closingLine);
      message = `${message.slice(0, idx).trimEnd()}\n\n${extraLines.join('\n')}\n\n${closingLine}`;
    } else {
      message += `\n\n${extraLines.join('\n')}`;
    }
  }

  return message;
}

export function buildOnlineOrderWhatsAppMessage(
  order: OnlineOrder,
  settings: BusinessSettings,
  options?: {
    attachmentKind?: 'image' | 'pdf';
    customer?: Customer | null;
    previousUdhaar?: number;
    advanceBalance?: number;
    customTemplate?: string;
  }
): string {
  const itemsSummary = order.items
    .map((it) => {
      const testTag =
        it.isCream || it.testPercentage ? ` [Test ${it.testPercentage || 51}%]` : '';
      return `• ${it.productName}${testTag}: ${it.quantityKg.toFixed(3)} kg × ₹${it.ratePerKg} = ₹${Math.round(it.total).toLocaleString('en-IN')}`;
    })
    .join('\n');

  const currentOrderAmount = Math.round(order.estimatedTotal);
  const previousUdhaar = Math.max(
    0,
    Math.round(options?.previousUdhaar ?? options?.customer?.pendingBalance ?? 0)
  );
  const availableAdvance = Math.max(
    0,
    Math.round(options?.advanceBalance ?? options?.customer?.advanceBalance ?? 0)
  );
  const grossTotal = currentOrderAmount + previousUdhaar;
  const advanceAdjusted = Math.min(availableAdvance, grossTotal);
  const netPayable = Math.max(0, grossTotal - advanceAdjusted);
  const remainingAdvance = Math.max(0, availableAdvance - advanceAdjusted);

  const breakdownLines: string[] = ['-----------------------------------'];
  breakdownLines.push(
    `🧾 *Current Order (आज का ऑर्डर):* ₹${currentOrderAmount.toLocaleString('en-IN')}`
  );
  if (previousUdhaar > 0) {
    breakdownLines.push(
      `⚠️ *Previous Pending Udhaar (पिछला बकाया):* +₹${previousUdhaar.toLocaleString('en-IN')}`
    );
  }
  if (advanceAdjusted > 0) {
    breakdownLines.push(
      `✨ *Advance Adjusted (पुराना एडवांस घटाया):* -₹${advanceAdjusted.toLocaleString('en-IN')}`
    );
  }
  breakdownLines.push(
    `💰 *${
      previousUdhaar > 0 || advanceAdjusted > 0
        ? 'Total Payable on Pickup (कुल देय राशि)'
        : 'Estimated Amount (अनुमानित राशि)'
    }:* ₹${netPayable.toLocaleString('en-IN')}`
  );
  if (remainingAdvance > 0) {
    breakdownLines.push(
      `🏦 *Remaining Advance Credit (शेष एडवांस जमा):* ₹${remainingAdvance.toLocaleString('en-IN')}`
    );
  }
  if (order.notes && order.notes.trim()) {
    breakdownLines.push(`📝 *Note:* ${order.notes.trim()}`);
  }
  breakdownLines.push('-----------------------------------');
  const orderBreakdown = breakdownLines.join('\n');

  const homeAddr = settings.homeAddress?.trim() || '';
  const pickupAddressLine = homeAddr
    ? `📍 *Pickup Address (घर का पता):* ${homeAddr}${settings.phone ? ` • Ph: ${settings.phone}` : ''}`
    : settings.phone
    ? `📞 Ph: ${settings.phone}`
    : '';

  let message = '';

  if (order.status === 'delivered' && !options?.customTemplate) {
    const lines: string[] = [`🙏 *${settings.shopName}* 🙏`];
    lines.push(`✅ *ORDER DELIVERED / डिलीवरी पूर्ण* 🎉`);
    lines.push(`🧾 *Order No:* ${order.orderNo} • 📅 ${formatDateTime(order.createdAt)}`);
    lines.push(`👤 *Customer:* ${order.customerName}`);
    lines.push('');
    lines.push(`📦 *Ordered Items:*`);
    lines.push(itemsSummary);
    lines.push('');
    lines.push(orderBreakdown);
    lines.push(`✅ *Status:* Delivered (डिलीवरी हो चुकी है)`);
    if (order.completedInvoiceNo) {
      lines.push(`🧾 *Final Bill No:* ${order.completedInvoiceNo}`);
    }
    lines.push('');
    lines.push(`Thank you for choosing our pure Desi Ghee! 🧈`);
    lines.push(`आपका दिन शुभ हो।`);
    message = lines.join('\n');
  } else {
    const rawReadyTpl = settings.whatsAppTemplates?.onlineOrderReadyTemplate?.trim();
    const resolvedReadyTpl =
      !rawReadyTpl || rawReadyTpl === LEGACY_V1_ONLINE_ORDER_READY_TEMPLATE.trim()
        ? DEFAULT_WHATSAPP_TEMPLATES.onlineOrderReadyTemplate
        : settings.whatsAppTemplates!.onlineOrderReadyTemplate!;

    const templateToUse =
      options?.customTemplate ||
      (order.status === 'ready'
        ? resolvedReadyTpl
        : settings.whatsAppTemplates?.onlineOrderConfirmedTemplate?.trim() ||
          DEFAULT_WHATSAPP_TEMPLATES.onlineOrderConfirmedTemplate);

    message = substituteVariables(templateToUse, {
      shopName: settings.shopName,
      shopPhone: settings.phone || '',
      homeAddress: homeAddr,
      pickupAddressLine,
      customerName: order.customerName,
      orderNo: order.orderNo,
      dateTime: formatDateTime(order.createdAt),
      itemsSummary,
      orderBreakdown,
      currentOrderAmount: currentOrderAmount.toLocaleString('en-IN'),
      previousUdhaar: previousUdhaar.toLocaleString('en-IN'),
      advanceAdjusted: advanceAdjusted.toLocaleString('en-IN'),
      netPayable: netPayable.toLocaleString('en-IN'),
      remainingAdvance: remainingAdvance.toLocaleString('en-IN'),
      notes: order.notes?.trim() || '',
    });
  }

  if (options?.attachmentKind) {
    const attachNote = `📎 _${
      options.attachmentKind === 'image'
        ? 'Order receipt photograph'
        : 'Order receipt PDF'
    } attached for your records._`;
    const closingLine = 'आपका दिन शुभ हो।';
    if (message.trimEnd().endsWith(closingLine)) {
      const idx = message.lastIndexOf(closingLine);
      message = `${message.slice(0, idx).trimEnd()}\n\n${attachNote}\n${closingLine}`;
    } else {
      message += `\n\n${attachNote}`;
    }
  }

  return message;
}

