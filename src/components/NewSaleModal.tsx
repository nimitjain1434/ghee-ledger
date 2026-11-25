import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Phone,
  User,
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { BusinessSettings, Customer, PaymentMode, ProductItem, Sale, SaleItem } from '../types';
import {
  calculateNewLoyaltyExpiry,
  checkCustomerLoyalty,
  LoyaltyStatus,
} from '../utils/loyalty';
import { formatCurrency } from '../utils/formatters';
import { isGheeProduct } from '../utils/gheeHelper';
import {
  calculateCreamRateFromGheeYield,
  calculateCreamBaseRateFromFinal,
  isCreamProduct,
} from '../utils/creamCalculator';

interface NewSaleModalProps {
  isOpen?: boolean;
  onClose: () => void;
  products: ProductItem[];
  customers: Customer[];
  settings?: BusinessSettings;
  initialCustomerPhone?: string;
  initialCustomerId?: string;
  saleToEdit?: Sale | null;
  onSaveSale: (sale: Sale, updatedCustomer?: Customer | null) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen = true,
  onClose,
  products,
  customers,
  settings,
  initialCustomerPhone = '',
  initialCustomerId = '',
  saleToEdit,
  onSaveSale,
}) => {
  // Customer State - Hooks must be called unconditionally at top level
  const [phone, setPhone] = useState(saleToEdit ? saleToEdit.customerPhone : initialCustomerPhone);
  const [customerName, setCustomerName] = useState(saleToEdit ? saleToEdit.customerName : '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    saleToEdit && saleToEdit.customerId && saleToEdit.customerId !== 'cust_walkin'
      ? saleToEdit.customerId
      : initialCustomerId || null
  );
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);

  const isSchemeEnabled = settings?.loyaltySchemeEnabled !== false;
  const schemeDiscountPercent = settings?.gheeSchemeDiscountPercent || 5;

  // Cart Items State
  const defaultProduct = products[0] || {
    id: 'prod_1',
    name: 'Pure Desi Cow Ghee',
    defaultRatePerKg: 680,
    isGhee: true,
  };

  const createDefaultSaleItem = (prod: ProductItem): SaleItem => {
    const isPhysicalGhee = isGheeProduct(prod, products);
    const isCream = isCreamProduct(prod);
    if (isCream) {
      const test = prod.testPercentage || 51;
      const base = prod.baseRatePerKg || prod.defaultRatePerKg || 335;
      const res = calculateCreamRateFromGheeYield(test, base, 1);
      return {
        productId: prod.id,
        productName: prod.name,
        quantityKg: 1,
        ratePerKg: res.finalRatePerKg,
        total: res.totalAmount,
        isGhee: false,
        schemeEligible: false,
        isCream: true,
        testPercentage: test,
        baseRate: base,
        gheeYieldPercent: res.gheeYieldPercent,
        gheeYieldKg: res.gheeYieldKgPerKg,
        adjustTarget: 'qty',
      };
    }
    return {
      productId: prod.id,
      productName: prod.name,
      quantityKg: 1,
      ratePerKg: prod.defaultRatePerKg,
      total: prod.defaultRatePerKg,
      isGhee: isPhysicalGhee,
      schemeEligible: prod.schemeEligible !== false,
      isCream: false,
      adjustTarget: 'qty',
    };
  };

  const [items, setItems] = useState<SaleItem[]>(() => {
    if (saleToEdit && saleToEdit.items && saleToEdit.items.length > 0) {
      return saleToEdit.items.map((it) => ({ ...it }));
    }
    return [createDefaultSaleItem(defaultProduct)];
  });

  // Discount & Payment
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(
    saleToEdit ? saleToEdit.isLoyaltyDiscountApplied : false
  );
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number>(
    saleToEdit && !saleToEdit.isLoyaltyDiscountApplied ? saleToEdit.discountPercent : 0
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    saleToEdit ? saleToEdit.paymentMode : 'cash'
  );
  const [applyAdvanceBalance, setApplyAdvanceBalance] = useState<boolean>(
    saleToEdit ? (saleToEdit.advanceUsed || 0) > 0 : true
  );
  const [includePreviousUdhaar, setIncludePreviousUdhaar] = useState<boolean>(
    saleToEdit ? (saleToEdit.previousUdhaar || 0) > 0 : true
  );
  const [amountReceived, setAmountReceived] = useState<number>(
    saleToEdit ? saleToEdit.cashReceived + saleToEdit.onlineReceived : 0
  );
  const [cashAmount, setCashAmount] = useState<number>(saleToEdit ? saleToEdit.cashReceived : 0);
  const [onlineAmount, setOnlineAmount] = useState<number>(saleToEdit ? saleToEdit.onlineReceived : 0);
  const [notes, setNotes] = useState(saleToEdit ? saleToEdit.notes || '' : '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if saleToEdit or initialCustomerPhone changes
  useEffect(() => {
    if (saleToEdit) {
      setPhone(saleToEdit.customerPhone || '');
      setCustomerName(saleToEdit.customerName || '');
      setSelectedCustomerId(
        saleToEdit.customerId && saleToEdit.customerId !== 'cust_walkin'
          ? saleToEdit.customerId
          : null
      );
      setItems(saleToEdit.items.map((it) => ({ ...it })));
      setApplyLoyaltyDiscount(saleToEdit.isLoyaltyDiscountApplied);
      setManualDiscountPercent(saleToEdit.isLoyaltyDiscountApplied ? 0 : saleToEdit.discountPercent);
      setPaymentMode(saleToEdit.paymentMode);
      setApplyAdvanceBalance((saleToEdit.advanceUsed || 0) > 0);
      setIncludePreviousUdhaar((saleToEdit.previousUdhaar || 0) > 0);
      setAmountReceived(saleToEdit.cashReceived + saleToEdit.onlineReceived);
      setCashAmount(saleToEdit.cashReceived);
      setOnlineAmount(saleToEdit.onlineReceived);
      setNotes(saleToEdit.notes || '');
    } else {
      setPhone(initialCustomerPhone);
      setCustomerName('');
      setSelectedCustomerId(initialCustomerId || null);
      setItems([createDefaultSaleItem(defaultProduct)]);
      setApplyLoyaltyDiscount(false);
      setManualDiscountPercent(0);
      setPaymentMode('cash');
      setApplyAdvanceBalance(true);
      setIncludePreviousUdhaar(true);
      setAmountReceived(0);
      setCashAmount(0);
      setOnlineAmount(0);
      setNotes('');
    }
    setValidationError(null);
  }, [saleToEdit, initialCustomerPhone, initialCustomerId]);

  // Handle customer lookup by selected ID or phone number
  useEffect(() => {
    const cleanPhone = phone.trim();
    let found: Customer | undefined;

    if (selectedCustomerId) {
      found = customers.find((c) => c.id === selectedCustomerId);
    }

    if (!found && cleanPhone.length >= 4) {
      found = customers.find(
        (c) => c.phone && (c.phone.includes(cleanPhone) || cleanPhone.includes(c.phone))
      );
    }

    if (found) {
      setMatchedCustomer(found);
      if (cleanPhone.length >= 4 || selectedCustomerId) {
        setCustomerName((prev) => (selectedCustomerId || cleanPhone.length >= 4 ? found!.name : prev));
      }
      const status = checkCustomerLoyalty(found);
      setLoyaltyStatus(status);
      if (isSchemeEnabled && status.isEligible) {
        setApplyLoyaltyDiscount(true);
      } else if (!saleToEdit) {
        setApplyLoyaltyDiscount(false);
      }
      return;
    }

    setMatchedCustomer(null);
    setLoyaltyStatus(null);
    setApplyLoyaltyDiscount(false);
  }, [phone, selectedCustomerId, customers, isSchemeEnabled, saleToEdit]);

  // Quick customer suggestions when typing name or partial phone (if not yet matched)
  const customerSuggestions =
    !matchedCustomer && (phone.trim().length >= 2 || customerName.trim().length >= 2)
      ? customers
          .filter((c) => {
            const qPhone = phone.trim().toLowerCase();
            const qName = customerName.trim().toLowerCase();
            const matchByPhone = qPhone.length >= 2 && c.phone.toLowerCase().includes(qPhone);
            const matchByName = qName.length >= 2 && c.name.toLowerCase().includes(qName);
            return matchByPhone || matchByName;
          })
          .slice(0, 4)
      : [];

  // Calculations (strictly whole rupees in Dairy/Mandi retail)
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0));
  const totalGheeKg = items
    .filter((it) => isGheeProduct(it, products))
    .reduce((sum, it) => sum + it.quantityKg, 0);

  const discountPercent = applyLoyaltyDiscount ? schemeDiscountPercent : manualDiscountPercent;
  // Calculate discount specifically on ghee or entire bill
  const gheeSubtotal = items
    .filter((it) => isGheeProduct(it, products))
    .reduce((sum, it) => sum + it.total, 0);

  const discountAmount = applyLoyaltyDiscount
    ? Math.round((gheeSubtotal * schemeDiscountPercent) / 100)
    : Math.round((subtotal * manualDiscountPercent) / 100);

  const finalTotal = Math.max(0, Math.round(subtotal - discountAmount));

  // Customer previous pending Udhaar & advance credit available before this bill (accounting for edit mode cleanly)
  const availablePreviousUdhaar = matchedCustomer
    ? Math.max(
        0,
        Math.round(
          (matchedCustomer.pendingBalance -
            (saleToEdit?.pendingAmount || 0) +
            (saleToEdit?.previousUdhaarCleared || 0)) *
            100
        ) / 100
      )
    : 0;

  const previousUdhaarIncluded =
    includePreviousUdhaar && availablePreviousUdhaar > 0 ? availablePreviousUdhaar : 0;

  const grossWithPrevious = Math.round((finalTotal + previousUdhaarIncluded) * 100) / 100;

  const availableAdvance = matchedCustomer
    ? Math.max(
        0,
        Math.round(
          ((matchedCustomer.advanceBalance || 0) +
            (saleToEdit?.advanceUsed || 0) -
            (saleToEdit?.extraPaymentAdded || 0)) *
            100
        ) / 100
      )
    : 0;

  const advanceUsed =
    applyAdvanceBalance && availableAdvance > 0
      ? Math.min(availableAdvance, grossWithPrevious)
      : 0;

  const netPayable = Math.max(0, Math.round((grossWithPrevious - advanceUsed) * 100) / 100);

  const skipInitialPaymentSyncRef = useRef<boolean>(Boolean(saleToEdit));

  // Sync received amount default when netPayable or paymentMode changes
  useEffect(() => {
    if (skipInitialPaymentSyncRef.current) {
      skipInitialPaymentSyncRef.current = false;
      return;
    }
    setAmountReceived(netPayable);
    if (paymentMode === 'cash') {
      setCashAmount(netPayable);
      setOnlineAmount(0);
    } else if (paymentMode === 'online') {
      setCashAmount(0);
      setOnlineAmount(netPayable);
    } else {
      // Split
      setCashAmount(Math.round(netPayable / 2));
      setOnlineAmount(netPayable - Math.round(netPayable / 2));
    }
  }, [netPayable, paymentMode]);

  // Adjust cash/online for split
  const handleCashChange = (val: number) => {
    const validVal = Math.max(0, val);
    setCashAmount(validVal);
    setAmountReceived(validVal + onlineAmount);
  };

  const handleOnlineChange = (val: number) => {
    const validVal = Math.max(0, val);
    setOnlineAmount(validVal);
    setAmountReceived(cashAmount + validVal);
  };

  // FIFO settlement: payment + advanceUsed first settles included previousUdhaar, remainder settles current bill
  const settledPool = Math.round((advanceUsed + amountReceived) * 100) / 100;
  const previousUdhaarCleared = Math.min(previousUdhaarIncluded, settledPool);
  const remainingPoolForCurrentBill = Math.max(
    0,
    Math.round((settledPool - previousUdhaarCleared) * 100) / 100
  );
  // Unpaid portion of THIS bill (keeps daily credit totals & sales reports accurate)
  const pendingAmount = Math.max(
    0,
    Math.round((finalTotal - remainingPoolForCurrentBill) * 100) / 100
  );
  // Combined remaining Udhaar due across previous + current bill
  const totalBalanceDue = Math.max(0, Math.round((netPayable - amountReceived) * 100) / 100);
  // Extra payment beyond combined netPayable -> saved as Advance Credit
  const extraPaymentAdded = Math.max(0, Math.round((amountReceived - netPayable) * 100) / 100);

  // Item helpers
  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    const qty = newItems[index].quantityKg;
    const isPhysicalGhee = isGheeProduct(prod, products);
    const isCream = isCreamProduct(prod);

    if (isCream) {
      const test = prod.testPercentage || 51;
      const base = prod.baseRatePerKg || prod.defaultRatePerKg || 335;
      const res = calculateCreamRateFromGheeYield(test, base, qty);
      newItems[index] = {
        productId: prod.id,
        productName: prod.name,
        quantityKg: qty,
        ratePerKg: res.finalRatePerKg,
        total: res.totalAmount,
        isGhee: false,
        schemeEligible: false,
        isCream: true,
        testPercentage: test,
        baseRate: base,
        gheeYieldPercent: res.gheeYieldPercent,
        gheeYieldKg: Math.round(qty * res.gheeYieldKgPerKg * 1000) / 1000,
      };
    } else {
      newItems[index] = {
        productId: prod.id,
        productName: prod.name,
        quantityKg: qty,
        ratePerKg: prod.defaultRatePerKg,
        total: Math.round(qty * prod.defaultRatePerKg),
        isGhee: isPhysicalGhee,
        schemeEligible: prod.schemeEligible !== false,
        isCream: false,
      };
    }
    setItems(newItems);
  };

  // Cream specific handlers (Realized Ghee-Yield Pricing)
  const handleCreamTestChange = (index: number, test: number) => {
    const validTest = isNaN(test) ? 0 : test;
    const newItems = [...items];
    const currentItem = newItems[index];
    const base = currentItem.baseRate ?? 335;

    if (validTest > 0) {
      const res = calculateCreamRateFromGheeYield(validTest, base, currentItem.quantityKg);
      newItems[index] = {
        ...currentItem,
        testPercentage: validTest,
        baseRate: base,
        ratePerKg: res.finalRatePerKg,
        total: res.totalAmount, // Round whole rupee
        gheeYieldPercent: res.gheeYieldPercent,
        gheeYieldKg: Math.round(currentItem.quantityKg * res.gheeYieldKgPerKg * 1000) / 1000,
      };
    } else {
      newItems[index] = {
        ...currentItem,
        testPercentage: 0,
        ratePerKg: 0,
        total: 0,
      };
    }
    setItems(newItems);
  };

  const handleCreamBaseRateChange = (index: number, base: number) => {
    const validBase = isNaN(base) ? 0 : base;
    const newItems = [...items];
    const currentItem = newItems[index];
    const test = currentItem.testPercentage ?? 51;

    if (validBase > 0) {
      const res = calculateCreamRateFromGheeYield(test, validBase, currentItem.quantityKg);
      newItems[index] = {
        ...currentItem,
        baseRate: validBase,
        testPercentage: test,
        ratePerKg: res.finalRatePerKg,
        total: res.totalAmount, // Round whole rupee
        gheeYieldPercent: res.gheeYieldPercent,
        gheeYieldKg: Math.round(currentItem.quantityKg * res.gheeYieldKgPerKg * 1000) / 1000,
      };
    } else {
      newItems[index] = {
        ...currentItem,
        baseRate: 0,
        ratePerKg: 0,
        total: 0,
      };
    }
    setItems(newItems);
  };

  // Two-way calculation: Adjusting Final Rate back-calculates Base Rate
  const handleCreamFinalRateChange = (index: number, finalRate: number) => {
    const validFinalRate = isNaN(finalRate) ? 0 : finalRate;
    const newItems = [...items];
    const currentItem = newItems[index];
    const test = currentItem.testPercentage ?? 51;
    const recalculatedBase = calculateCreamBaseRateFromFinal(test, validFinalRate);
    const rawTotal = currentItem.quantityKg * validFinalRate;
    const total = Math.round(rawTotal); // Round whole rupee

    newItems[index] = {
      ...currentItem,
      ratePerKg: validFinalRate,
      baseRate: recalculatedBase,
      total,
    };
    setItems(newItems);
  };

  // Change Quantity -> Calculate Amount (total)
  const handleItemQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(0, Number(qty) || 0);
    const roundedQty = Math.round(validQty * 1000) / 1000;
    const newItems = [...items];
    const currentItem = newItems[index];
    const rate = currentItem.ratePerKg;
    const total = Math.round(roundedQty * rate); // Round whole rupee

    newItems[index] = {
      ...currentItem,
      quantityKg: roundedQty,
      total,
      gheeYieldKg: currentItem.isCream && currentItem.testPercentage
        ? Math.round(roundedQty * ((currentItem.testPercentage - 1) / 100) * 1000) / 1000
        : currentItem.gheeYieldKg,
    };
    setItems(newItems);
  };

  // Toggle adjust target: 'qty' (default, changing amount changes weight) vs 'rate' (bargain, changing amount changes rate/base rate)
  const handleItemAdjustTargetChange = (index: number, target: 'qty' | 'rate') => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      adjustTarget: target,
    };
    setItems(newItems);
  };

  // Change Amount -> Calculate Weight (if adjustTarget !== 'rate') OR Calculate Rate / Base Rate (if adjustTarget === 'rate')
  const handleItemAmountChange = (index: number, amount: number) => {
    const validAmount = Math.max(0, Number(amount) || 0);
    const roundedAmount = Math.round(validAmount); // Round whole rupee
    const newItems = [...items];
    const currentItem = newItems[index];

    if (currentItem.adjustTarget === 'rate') {
      // Bargain / Round-Off: Quantity stays fixed, Rate is adjusted to Amount / Quantity
      const currentQty = currentItem.quantityKg;
      if (currentQty > 0) {
        const rawRate = roundedAmount / currentQty;
        const newRate = Math.round(rawRate * 100) / 100; // rounded to 2 decimal places (paise)

        if (currentItem.isCream) {
          const test = currentItem.testPercentage ?? 51;
          const recalculatedBase = calculateCreamBaseRateFromFinal(test, newRate);
          newItems[index] = {
            ...currentItem,
            total: roundedAmount,
            ratePerKg: newRate,
            baseRate: recalculatedBase,
          };
        } else {
          newItems[index] = {
            ...currentItem,
            total: roundedAmount,
            ratePerKg: newRate,
          };
        }
      } else {
        newItems[index] = {
          ...currentItem,
          total: roundedAmount,
        };
      }
    } else {
      // Default: Rate stays fixed, Weight (quantityKg) is adjusted to Amount / Rate
      const rate = currentItem.ratePerKg;
      let qty = currentItem.quantityKg;
      if (rate > 0) {
        qty = Math.round((roundedAmount / rate) * 1000) / 1000;
      }

      newItems[index] = {
        ...currentItem,
        total: roundedAmount,
        quantityKg: qty,
        gheeYieldKg: currentItem.isCream && currentItem.testPercentage
          ? Math.round(qty * ((currentItem.testPercentage - 1) / 100) * 1000) / 1000
          : currentItem.gheeYieldKg,
      };
    }
    setItems(newItems);
  };

  // Change Rate -> Recalculate Amount (for standard items)
  const handleItemRateChange = (index: number, rate: number) => {
    const validRate = Math.max(0, Number(rate) || 0);
    const newItems = [...items];
    const qty = newItems[index].quantityKg;
    newItems[index].ratePerKg = validRate;
    newItems[index].total = Math.round(qty * validRate); // Round whole rupee
    setItems(newItems);
  };

  const addItem = () => {
    const isPhysicalGhee = isGheeProduct(defaultProduct, products);
    const isCream = isCreamProduct(defaultProduct);

    if (isCream) {
      const test = defaultProduct.testPercentage || 51;
      const base = defaultProduct.baseRatePerKg || defaultProduct.defaultRatePerKg || 335;
      const res = calculateCreamRateFromGheeYield(test, base, 1);
      setItems([
        ...items,
        {
          productId: defaultProduct.id,
          productName: defaultProduct.name,
          quantityKg: 1,
          ratePerKg: res.finalRatePerKg,
          total: res.totalAmount,
          isGhee: false,
          schemeEligible: false,
          isCream: true,
          testPercentage: test,
          baseRate: base,
          gheeYieldPercent: res.gheeYieldPercent,
          gheeYieldKg: res.gheeYieldKgPerKg,
          adjustTarget: 'qty',
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          productId: defaultProduct.id,
          productName: defaultProduct.name,
          quantityKg: 1,
          ratePerKg: defaultProduct.defaultRatePerKg,
          total: defaultProduct.defaultRatePerKg,
          isGhee: isPhysicalGhee,
          schemeEligible: defaultProduct.schemeEligible !== false,
          isCream: false,
          adjustTarget: 'qty',
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Preview next scheme validity for this customer
  const nextSchemeExpiry = calculateNewLoyaltyExpiry(
    totalGheeKg,
    new Date(),
    matchedCustomer?.loyaltyExpiresAt
  );
  const nextExpiryFormatted = nextSchemeExpiry
    ? new Date(nextSchemeExpiry).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const schemeMonthsEarned = totalGheeKg >= 1 ? `${totalGheeKg} Month(s)` : '15 Days';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (items.length === 0 || finalTotal <= 0) {
      setValidationError('Please add valid items with amount to the bill.');
      return;
    }

    const hasInvalidItem = items.some((it) => it.quantityKg <= 0 || it.ratePerKg <= 0 || it.total <= 0);
    if (hasInvalidItem) {
      setValidationError('Please ensure valid Quantity and Rate are entered for all items.');
      return;
    }

    const cleanPhone = phone.trim();
    const isAnonymous = !cleanPhone;
    const finalCustomerName =
      customerName.trim() ||
      (isAnonymous ? 'Walk-in Customer (नकद ग्राहक)' : `Customer ${cleanPhone.slice(-4)}`);

    if (pendingAmount > 0 && isAnonymous && !customerName.trim()) {
      setValidationError('Udhaar (उधार) requires a Customer Name or Mobile Number so it can be tracked in Khata.');
      return;
    }

    if (extraPaymentAdded > 0 && isAnonymous && !customerName.trim()) {
      setValidationError('Extra / Advance money requires a Customer Name or Mobile Number so it can be saved to their Khata for their next bill.');
      return;
    }

    const saleId = saleToEdit ? saleToEdit.id : `sale_${Date.now()}`;
    const invoiceNo = saleToEdit ? saleToEdit.invoiceNo : `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleDate = saleToEdit ? saleToEdit.date : new Date().toISOString();

    const actualCashReceived =
      paymentMode === 'cash'
        ? amountReceived
        : paymentMode === 'online'
        ? 0
        : cashAmount;

    const actualOnlineReceived =
      paymentMode === 'online'
        ? amountReceived
        : paymentMode === 'cash'
        ? 0
        : onlineAmount;

    const newSale: Sale = {
      id: saleId,
      invoiceNo,
      customerId: matchedCustomer
        ? matchedCustomer.id
        : cleanPhone
        ? `cust_${cleanPhone}`
        : 'cust_walkin',
      customerName: finalCustomerName,
      customerPhone: cleanPhone,
      date: saleDate,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      totalAmount: finalTotal,
      paymentMode,
      cashReceived: actualCashReceived,
      onlineReceived: actualOnlineReceived,
      pendingAmount,
      previousUdhaar: previousUdhaarIncluded > 0 ? previousUdhaarIncluded : 0,
      previousUdhaarCleared: previousUdhaarCleared > 0 ? previousUdhaarCleared : 0,
      advanceUsed: advanceUsed > 0 ? advanceUsed : 0,
      extraPaymentAdded: extraPaymentAdded > 0 ? extraPaymentAdded : 0,
      isLoyaltyDiscountApplied: isSchemeEnabled && applyLoyaltyDiscount,
      loyaltySchemeActivatedKg: isSchemeEnabled ? totalGheeKg : 0,
      notes: notes.trim(),
    };

    let updatedCustomer: Customer | null = null;
    if (matchedCustomer) {
      const oldTotal = saleToEdit ? saleToEdit.totalAmount : 0;
      const oldGheeKg = saleToEdit ? saleToEdit.loyaltySchemeActivatedKg || 0 : 0;

      const updatedPending = Math.max(
        0,
        Math.round((availablePreviousUdhaar - previousUdhaarCleared + pendingAmount) * 100) / 100
      );
      const updatedAdvance = Math.max(
        0,
        Math.round((availableAdvance - advanceUsed + extraPaymentAdded) * 100) / 100
      );

      updatedCustomer = {
        ...matchedCustomer,
        name: customerName.trim() || matchedCustomer.name,
        phone: cleanPhone || matchedCustomer.phone,
        totalPurchases: Math.max(0, matchedCustomer.totalPurchases - oldTotal + finalTotal),
        totalGheeBoughtKg: Math.max(
          0,
          Math.round((matchedCustomer.totalGheeBoughtKg - oldGheeKg + totalGheeKg) * 1000) / 1000
        ),
        pendingBalance: updatedPending,
        advanceBalance: updatedAdvance,
        lastGheePurchaseDate:
          totalGheeKg > 0 ? new Date().toISOString() : matchedCustomer?.lastGheePurchaseDate,
        lastGheePurchaseKg: totalGheeKg > 0 ? totalGheeKg : matchedCustomer?.lastGheePurchaseKg,
        loyaltyExpiresAt:
          isSchemeEnabled && totalGheeKg > 0 ? nextSchemeExpiry : matchedCustomer?.loyaltyExpiresAt,
      };
    } else if (cleanPhone || pendingAmount > 0 || extraPaymentAdded > 0 || customerName.trim()) {
      updatedCustomer = {
        id: `cust_${cleanPhone || Date.now()}`,
        name: finalCustomerName,
        phone: cleanPhone,
        address: '',
        createdAt: new Date().toISOString(),
        totalPurchases: finalTotal,
        totalGheeBoughtKg: Math.round(totalGheeKg * 1000) / 1000,
        pendingBalance: pendingAmount,
        advanceBalance: extraPaymentAdded,
        lastGheePurchaseDate: totalGheeKg > 0 ? new Date().toISOString() : undefined,
        lastGheePurchaseKg: totalGheeKg > 0 ? totalGheeKg : undefined,
        loyaltyExpiresAt: isSchemeEnabled && totalGheeKg > 0 ? nextSchemeExpiry : undefined,
      };
    }

    onSaveSale(newSale, updatedCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-800/60 flex items-center justify-center font-bold text-lg">
              🧈
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {saleToEdit ? `Edit Sale Bill #${saleToEdit.invoiceNo} (बिल संशोधन)` : 'New Sale & Ghee Bill (नया बिल)'}
              </h2>
              <p className="text-xs text-amber-100">
                {isSchemeEnabled
                  ? `Automatic ${schemeDiscountPercent}% Loyalty Scheme & Cash Counter`
                  : 'Cash & Ledger Billing (Loyalty Scheme is OFF)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-amber-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 overflow-y-auto space-y-4 text-stone-800">
          {validationError && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}
          {/* Customer Lookup & Mobile */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                1. Customer Details (ग्राहक जानकारी - Optional)
              </span>
              {matchedCustomer && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Existing Customer Found
                  </span>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setPhone('');
                        setCustomerName('');
                      }}
                      className="text-[10px] font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700">
                    Mobile Number (मोबाइल नंबर)
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">Optional / ऐच्छिक</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    id="input-sale-phone"
                    type="tel"
                    placeholder="Optional (Leave blank for Walk-in)"
                    value={phone}
                    onChange={(e) => {
                      setSelectedCustomerId(null);
                      setPhone(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  {isSchemeEnabled
                    ? 'Enter mobile to auto-link Udhaar, Advance & 5% ghee scheme.'
                    : 'Enter mobile to link Udhaar or Advance from Khata.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700">
                    Customer Name (नाम)
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">Optional / ऐच्छिक</span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    id="input-sale-customer-name"
                    type="text"
                    placeholder="e.g. Ramesh or leave blank for Walk-in"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Defaults to &quot;Walk-in Customer (नकद ग्राहक)&quot; if empty.
                </p>
              </div>
            </div>

            {customerSuggestions.length > 0 && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2 space-y-1.5">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
                  Tap to link existing Khata customer (ग्राहक चुनें):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {customerSuggestions.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setPhone(cust.phone || '');
                        setCustomerName(cust.name);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <span>{cust.name}</span>
                      {cust.phone && <span className="text-[10px] font-mono text-stone-500">({cust.phone})</span>}
                      {cust.pendingBalance > 0 && (
                        <span className="text-[10px] font-mono font-bold text-rose-600">
                          Udhaar ₹{cust.pendingBalance}
                        </span>
                      )}
                      {(cust.advanceBalance || 0) > 0 && (
                        <span className="text-[10px] font-mono font-bold text-teal-700">
                          Adv ₹{cust.advanceBalance}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty Scheme Banner if customer found and scheme is enabled */}
            {isSchemeEnabled && loyaltyStatus && loyaltyStatus.isEligible && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-950">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>🌟 Desi Ghee {schemeDiscountPercent}% Repeat Scheme ACTIVE!</span>
                    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {loyaltyStatus.daysRemaining} days left
                    </span>
                  </div>
                  <p className="mt-0.5 text-stone-600">
                    Customer bought {loyaltyStatus.lastPurchaseKg.toFixed(3)} kg on{' '}
                    {loyaltyStatus.lastPurchaseDateFormatted || 'earlier'}. Valid till{' '}
                    <strong className="text-amber-900">{loyaltyStatus.expiresAtFormatted}</strong>.
                  </p>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                    <input
                      id="checkbox-apply-loyalty"
                      type="checkbox"
                      checked={applyLoyaltyDiscount}
                      onChange={(e) => setApplyLoyaltyDiscount(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Apply {schemeDiscountPercent}% Scheme Discount (-₹{discountAmount})</span>
                  </label>
                </div>
              </div>
            )}

            {!isSchemeEnabled && matchedCustomer && (
              <div className="bg-stone-100 border border-stone-300 rounded-lg p-2.5 flex items-center justify-between text-xs text-stone-600">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-stone-400" />
                  Loyalty Scheme is turned <strong>OFF</strong> in Settings.
                </span>
                <span className="text-[11px] text-stone-500">Enable in Settings anytime</span>
              </div>
            )}

            {isSchemeEnabled && matchedCustomer && !loyaltyStatus?.isEligible && (
              <div className="bg-stone-100 border border-stone-300 rounded-lg p-2.5 flex items-center gap-2 text-xs text-stone-600">
                <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                <span>
                  Previous scheme has expired or no previous Ghee purchase. This new ghee sale will
                  activate a fresh {schemeDiscountPercent}% discount window for next purchase!
                </span>
              </div>
            )}

            {matchedCustomer && availablePreviousUdhaar > 0 && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-1.5 text-xs text-rose-950">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Previous Pending Udhaar (पिछला बाकी उधार):
                  </span>
                  <span className="font-black font-mono text-sm text-rose-700">
                    {formatCurrency(availablePreviousUdhaar)}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-900">
                  <input
                    type="checkbox"
                    checked={includePreviousUdhaar}
                    onChange={(e) => setIncludePreviousUdhaar(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>
                    Include Previous Udhaar in this bill (+{formatCurrency(availablePreviousUdhaar)}) (पिछला बकाया बिल में जोड़ें)
                  </span>
                </label>
              </div>
            )}

            {matchedCustomer && availableAdvance > 0 && (
              <div className="bg-teal-50 border border-teal-300 rounded-xl p-3 space-y-1.5 text-xs text-teal-950">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-teal-900">
                    <Wallet className="w-4 h-4 text-teal-600" />
                    Extra Advance Money Available (ग्राहक का जमा एडवांस):
                  </span>
                  <span className="font-black font-mono text-sm text-teal-700">
                    {formatCurrency(availableAdvance)}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-teal-900">
                  <input
                    type="checkbox"
                    checked={applyAdvanceBalance}
                    onChange={(e) => setApplyAdvanceBalance(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    Deduct from this bill (-{formatCurrency(Math.min(availableAdvance, grossWithPrevious))})
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Product Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  2. Products, Weight & Amount (सामान, वजन व रुपये)
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  Tip: You can enter <strong>Weight</strong> OR <strong>Rupee Amount</strong> (e.g. ₹300 ghee)
                </span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item (+ सामान)
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg border border-stone-300 text-sm font-medium bg-white focus:border-amber-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.nameHindi}) - ₹{p.defaultRatePerKg}/kg
                        </option>
                      ))}
                    </select>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Cream Realized Ghee-Yield Pricing UI vs Standard Product UI */}
                  {item.isCream ? (
                    <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                          <span>🥛 Realized Ghee-Yield Cream Calculation (मलाई घी-यील्ड)</span>
                        </span>
                        <span className="text-[10px] font-mono bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-bold">
                          Base: 51% Test = 500g Pure Ghee
                        </span>
                      </div>

                      {/* 3 Inputs + 2 Outputs Grid */}
                      <div className="grid grid-cols-12 gap-2 text-xs">
                        {/* Input 1: Test Percentage */}
                        <div className="col-span-3">
                          <label className="text-stone-700 block text-[11px] font-bold mb-0.5">
                            Test % (फैट %) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="100"
                              placeholder="51.0"
                              value={item.testPercentage === 0 ? '' : (item.testPercentage ?? 51)}
                              onChange={(e) => handleCreamTestChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-full py-1.5 px-2 rounded-lg border border-amber-300 font-bold bg-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                            />
                            <span className="absolute right-2 top-1.5 text-stone-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        {/* Input 2: Base Rate (51% Test) */}
                        <div className="col-span-3">
                          <label className="text-stone-700 block text-[11px] font-bold mb-0.5">
                            Base Rate (51%) ₹ *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-stone-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="335"
                              value={item.baseRate === 0 ? '' : (item.baseRate ?? 335)}
                              onChange={(e) => handleCreamBaseRateChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-full py-1.5 pl-5 pr-2 rounded-lg border border-amber-300 font-bold bg-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                            />
                          </div>
                          {/* Radio: Adjust Base Rate / Rate */}
                          <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-amber-950 font-semibold select-none">
                            <input
                              type="radio"
                              name={`adjust_target_cream_${idx}`}
                              value="rate"
                              checked={item.adjustTarget === 'rate'}
                              onChange={() => handleItemAdjustTargetChange(idx, 'rate')}
                              className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span>Adjust Base Rate (रेट बदले)</span>
                          </label>
                        </div>

                        {/* Output 1 / Two-Way Input: Per-Kg Final Rate */}
                        <div className="col-span-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-amber-900 block text-[11px] font-bold">
                              Final Rate (₹/kg)
                            </label>
                            <span className="text-[9px] text-amber-700 font-semibold">Editable</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-amber-600 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={item.ratePerKg === 0 ? '' : item.ratePerKg}
                              onChange={(e) => handleCreamFinalRateChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-full py-1.5 pl-5 pr-2 rounded-lg border border-amber-400 font-black bg-amber-100/70 text-amber-950 text-sm focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 font-mono"
                              title="Rate per kg for this test %. Typing here back-calculates Base Rate."
                            />
                          </div>
                          <span className="text-[9px] text-stone-400 block mt-1">
                            {item.adjustTarget === 'rate' ? '★ Auto-adjusts from Amount' : 'Two-way sync with Base'}
                          </span>
                        </div>

                        {/* Input 3: Quantity */}
                        <div className="col-span-3">
                          <label className="text-stone-700 block text-[11px] font-bold mb-0.5">
                            Qty (kg / किलो) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.000"
                            value={item.quantityKg === 0 ? '' : item.quantityKg}
                            onChange={(e) => handleItemQtyChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full py-1.5 px-2 rounded-lg border border-stone-300 font-bold bg-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                          {/* Radio: Adjust Quantity (Default) */}
                          <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-stone-700 font-semibold select-none">
                            <input
                              type="radio"
                              name={`adjust_target_cream_${idx}`}
                              value="qty"
                              checked={item.adjustTarget !== 'rate'}
                              onChange={() => handleItemAdjustTargetChange(idx, 'qty')}
                              className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span>Adjust Qty (वजन बदले - Default)</span>
                          </label>
                        </div>
                      </div>

                      {/* Output 2: Final Amount Row & Ghee Yield Breakdown */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200">
                        <div className="text-[11px] text-stone-600">
                          <span>
                            Yield: <strong>{((item.testPercentage ?? 51) - 1).toFixed(1)}%</strong> ({(((item.testPercentage ?? 51) - 1) * 10).toFixed(0)}g pure ghee/kg)
                          </span>
                          <span className="mx-1.5 text-stone-300">·</span>
                          <span>
                            Implicit Ghee Value: <strong>₹{((item.baseRate ?? 335) * 2).toFixed(2)}/kg</strong>
                          </span>
                          <span className="mx-1.5 text-stone-300">·</span>
                          <span className="text-amber-800 font-medium">
                            Rate = ₹{item.baseRate ?? 335} × (({item.testPercentage ?? 51} - 1) / 50) = ₹{item.ratePerKg}/kg
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <label className="text-amber-950 font-bold text-xs whitespace-nowrap">
                            Final Amount (Round ₹):
                          </label>
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1.5 text-amber-700 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0"
                              value={item.total === 0 ? '' : Math.round(item.total)}
                              onChange={(e) => handleItemAmountChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-full py-1 pl-6 pr-2 rounded-lg border-2 border-amber-500 font-black font-mono text-stone-900 bg-white text-sm focus:border-amber-700 focus:ring-1 focus:ring-amber-500 text-right"
                              title={item.adjustTarget === 'rate'
                                ? "Bargain mode: Typing rupee amount will adjust Base Rate & Final Rate while keeping weight fixed"
                                : "Standard mode: Typing rupee amount will auto-calculate cream quantity in kg"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Weight (3 Decimals) + Rate + Amount (Editable) Grid for standard items */
                    <div className="grid grid-cols-12 gap-2 items-start text-xs">
                      {/* Weight (Qty) Column */}
                      <div className="col-span-4">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-stone-700 block text-[11px] font-bold">
                            Qty (kg / किलो)
                          </label>
                          <span className="text-[10px] text-stone-400 font-mono">3 Decimals</span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.000"
                          value={item.quantityKg === 0 ? '' : item.quantityKg}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className="w-full py-1.5 px-2 rounded-lg border border-stone-300 font-bold bg-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        {/* Radio: Adjust Qty (Default) */}
                        <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-stone-700 font-semibold select-none">
                          <input
                            type="radio"
                            name={`adjust_target_std_${idx}`}
                            value="qty"
                            checked={item.adjustTarget !== 'rate'}
                            onChange={() => handleItemAdjustTargetChange(idx, 'qty')}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Adjust Qty (वजन बदले - Default)</span>
                        </label>
                      </div>

                      {/* Rate Column */}
                      <div className="col-span-3">
                        <label className="text-stone-600 block text-[11px] font-medium mb-0.5">
                          Rate (₹/kg)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.ratePerKg === 0 ? '' : item.ratePerKg}
                          onChange={(e) => handleItemRateChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className="w-full py-1.5 px-2 rounded-lg border border-stone-300 bg-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        {/* Radio: Adjust Rate */}
                        <label className="flex items-center gap-1 cursor-pointer mt-1 text-[10px] text-amber-950 font-semibold select-none">
                          <input
                            type="radio"
                            name={`adjust_target_std_${idx}`}
                            value="rate"
                            checked={item.adjustTarget === 'rate'}
                            onChange={() => handleItemAdjustTargetChange(idx, 'rate')}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Adjust Rate (रेट बदले)</span>
                        </label>
                      </div>

                      {/* Amount Column - EDITABLE to support "Give me ₹300 ghee" or Bargain ₹7000 */}
                      <div className="col-span-5">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-amber-900 block text-[11px] font-bold">
                            Amount (₹ रुपये)
                          </label>
                          <span className="text-[10px] text-amber-800 bg-amber-100 font-semibold px-1 rounded">
                            {item.adjustTarget === 'rate' ? 'Bargain ₹' : 'Type ₹ here'}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-stone-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="e.g. 300"
                            value={item.total === 0 ? '' : Math.round(item.total)}
                            onChange={(e) => handleItemAmountChange(idx, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full py-1.5 pl-6 pr-2 rounded-lg border-2 border-amber-500 font-black font-mono text-stone-900 bg-amber-50/50 text-sm focus:border-amber-700 focus:bg-white focus:ring-1 focus:ring-amber-500"
                            title={item.adjustTarget === 'rate'
                              ? "Bargain mode: Typing rupee amount will adjust Rate per kg while keeping weight fixed"
                              : "Standard mode: Typing rupee amount will auto-calculate exact weight in kg"}
                          />
                        </div>
                        <span className="text-[9.5px] text-stone-400 block mt-1">
                          {item.adjustTarget === 'rate'
                            ? '★ Amount will discount rate (weight stays fixed)'
                            : 'Amount will recalculate weight in kg'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Presets: Quick Weight & Quick Rupee Buttons */}
                  <div className="space-y-1.5 pt-1 border-t border-stone-200/60">
                    {/* Quick Weight Presets */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-stone-400 font-medium mr-0.5">Weight:</span>
                      {[
                        { label: '250g (0.250)', val: 0.25 },
                        { label: '500g (0.500)', val: 0.5 },
                        { label: '1.000 kg', val: 1 },
                        { label: '2.000 kg', val: 2 },
                        { label: '5.000 kg', val: 5 },
                        { label: '15.000 kg (Tin)', val: 15 },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => handleItemQtyChange(idx, btn.val)}
                          className={`px-1.5 py-0.5 rounded font-medium border transition ${
                            Math.abs(item.quantityKg - btn.val) < 0.0005
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Rupee Presets - "Give me ₹300 ghee" */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-amber-800 font-bold mr-0.5">₹ Rupee:</span>
                      {[100, 200, 300, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleItemAmountChange(idx, amt)}
                          className={`px-2 py-0.5 rounded font-medium border transition ${
                            item.total === amt
                              ? 'bg-amber-800 text-white border-amber-800 font-bold'
                              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                      <span className="text-[10px] text-stone-400 ml-1">
                        (e.g. ₹300 = {(item.ratePerKg > 0 ? (300 / item.ratePerKg).toFixed(3) : '0.000')} kg)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scheme Earned Notice */}
            {isSchemeEnabled && totalGheeKg > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🎁</span>
                  <span>
                    Scheme reward: <strong>{totalGheeKg.toFixed(3)} kg Ghee</strong> activates {schemeDiscountPercent}% discount for{' '}
                    <strong>{schemeMonthsEarned}</strong>!
                  </span>
                </div>
                <span className="text-[11px] text-stone-500">Valid till: {nextExpiryFormatted}</span>
              </div>
            )}
          </div>

          {/* Payment & Cash Counter Breakdown */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              3. Payment & Ledger (भुगतान व रोकड़)
            </span>

            {/* Total calculation strip */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    {isSchemeEnabled && applyLoyaltyDiscount
                      ? `Loyalty Scheme ${schemeDiscountPercent}% Discount:`
                      : `Special Discount (${discountPercent}%):`}
                  </span>
                  <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>Current Bill Total (आज का बिल):</span>
                <span className="font-mono text-base text-amber-800">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
              {previousUdhaarIncluded > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Previous Pending Udhaar Added (पिछला उधार जोड़ा):</span>
                  <span className="font-mono">+ {formatCurrency(previousUdhaarIncluded)}</span>
                </div>
              )}
              {advanceUsed > 0 && (
                <div className="flex justify-between text-teal-700 font-bold">
                  <span>Advance Deducted (पुराना जमा घटाया):</span>
                  <span className="font-mono">- {formatCurrency(advanceUsed)}</span>
                </div>
              )}
              {(previousUdhaarIncluded > 0 || advanceUsed > 0) && (
                <div className="flex justify-between text-sm font-black text-stone-950 pt-1.5 border-t border-dashed border-stone-300">
                  <span>Total Payable Today (कुल देय राशि):</span>
                  <span className="font-mono text-base text-stone-950">
                    {formatCurrency(netPayable)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Payment Mode (भुगतान माध्यम)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    paymentMode === 'cash'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base">💵</span>
                  <span>Cash / नकद (गल्ला)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    paymentMode === 'online'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base">📱</span>
                  <span>Online / UPI (बैंक)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('split')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    paymentMode === 'split'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base">🔀</span>
                  <span>Split (नकद + ऑनलाइन)</span>
                </button>
              </div>
            </div>

            {/* Amount Received & Split Details */}
            {paymentMode === 'split' ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Cash in Drawer (गल्ले में नकद) ₹
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={cashAmount === 0 ? '' : cashAmount}
                    onChange={(e) => handleCashChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 rounded-lg border border-stone-300 text-sm font-bold text-amber-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Online in Bank (बैंक / UPI) ₹
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={onlineAmount === 0 ? '' : onlineAmount}
                    onChange={(e) => handleOnlineChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 rounded-lg border border-stone-300 text-sm font-bold text-indigo-900 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-stone-700">
                    Amount Received Now (अभी प्राप्त हुआ) ₹
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {previousUdhaarIncluded > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const onlyToday = Math.max(0, finalTotal - advanceUsed);
                            setAmountReceived(onlyToday);
                            if (paymentMode === 'cash') setCashAmount(onlyToday);
                            if (paymentMode === 'online') setOnlineAmount(onlyToday);
                          }}
                          className="text-[11px] text-stone-600 hover:underline font-semibold cursor-pointer"
                          title="Pay only today's bill and keep previous Udhaar separate"
                        >
                          Today&apos;s Bill ({formatCurrency(Math.max(0, finalTotal - advanceUsed))})
                        </button>
                        <span className="text-stone-300">|</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAmountReceived(netPayable);
                        if (paymentMode === 'cash') setCashAmount(netPayable);
                        if (paymentMode === 'online') setOnlineAmount(netPayable);
                      }}
                      className="text-[11px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Full Paid
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAmountReceived(0);
                        if (paymentMode === 'cash') setCashAmount(0);
                        if (paymentMode === 'online') setOnlineAmount(0);
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Full Udhaar
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={amountReceived === 0 ? '' : amountReceived}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                    setAmountReceived(val);
                    if (paymentMode === 'cash') setCashAmount(val);
                    if (paymentMode === 'online') setOnlineAmount(val);
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-stone-300 text-base font-bold text-stone-900 bg-white focus:border-amber-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Tip: Enter more than {formatCurrency(netPayable)} if customer pays extra money to save as advance for next time.
                </p>
              </div>
            )}

            {/* Pending (Udhaar) or Extra Advance Credit alert */}
            {totalBalanceDue > 0 ? (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center justify-between gap-2 text-rose-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      {previousUdhaarIncluded > 0
                        ? 'Total Remaining Balance / कुल बकाया (उधार):'
                        : 'Pending Balance / Udhaar (उधार):'}
                    </span>
                    <span className="text-[11px] text-rose-700 block">
                      {previousUdhaarIncluded > 0
                        ? `New Bill Due: ${formatCurrency(pendingAmount)} + Unpaid Prev. Udhaar: ${formatCurrency(
                            Math.max(0, previousUdhaarIncluded - previousUdhaarCleared)
                          )} → Saved to Khata`
                        : `This will be saved to ${customerName || 'customer'}'s khata ledger`}
                    </span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-rose-700 shrink-0">
                  {formatCurrency(totalBalanceDue)}
                </span>
              </div>
            ) : extraPaymentAdded > 0 ? (
              <div className="bg-teal-50 border border-teal-300 rounded-xl p-3 flex items-center justify-between text-teal-950">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">
                      Extra Money Paid → Saved as Advance (एडवांस जमा):
                    </span>
                    <span className="text-[11px] text-teal-800">
                      Linked to {customerName || 'customer'}&apos;s Khata &amp; auto-deducted on next bill!
                    </span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-teal-700">
                  +{formatCurrency(extraPaymentAdded)}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {previousUdhaarCleared > 0 && advanceUsed > 0
                    ? `All dues cleared! ₹${advanceUsed} Advance used + ₹${amountReceived} paid (includes ₹${previousUdhaarCleared} old Udhaar cleared).`
                    : previousUdhaarCleared > 0
                    ? `Full bill + ₹${previousUdhaarCleared} previous Udhaar cleared! Total paid: ₹${amountReceived}.`
                    : advanceUsed > 0
                    ? `Settled using ₹${advanceUsed} Advance${amountReceived > 0 ? ` + ₹${amountReceived} paid` : ''}!`
                    : 'Full payment received! No pending balance.'}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Notes (optional, e.g. packaging tin, delivery note)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg border border-stone-200 text-xs bg-white placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-sale-bill"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center gap-2 transition"
            >
              <span>{saleToEdit ? 'Update Sale Bill (बिल सुरक्षित करें)' : 'Save & Generate Bill (बिल बनाएं)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
