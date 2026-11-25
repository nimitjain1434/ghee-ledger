import React, { useState, useEffect } from 'react';
import {
  AppData,
  BusinessSettings,
  CashDrawerEntry,
  Customer,
  DenominationCount,
  KhataPayment,
  OnlineOrder,
  OnlineOrderStatus,
  ProductItem,
  PurchaseExpense,
  Sale,
} from './types';
import {
  clearAllData,
  exportBackupJSON,
  loadAllData,
  resetToSampleData,
  resetToZeroData,
  saveAllData,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { BottomNav, AppTab } from './components/BottomNav';
import { CashCounterTab } from './components/CashCounterTab';
import { SalesLedgerTab } from './components/SalesLedgerTab';
import { CustomerKhataTab } from './components/CustomerKhataTab';
import { PurchasesExpensesTab } from './components/PurchasesExpensesTab';
import { ReportsSummaryTab } from './components/ReportsSummaryTab';
import { PendingOrdersTab } from './components/PendingOrdersTab';
import { OnlineOrderReceiptModal } from './components/OnlineOrderReceiptModal';
import { NewSaleModal } from './components/NewSaleModal';
import { InvoiceModal } from './components/InvoiceModal';
import { QuickFatTestCalculatorModal } from './components/QuickFatTestCalculatorModal';
import { Plus, RefreshCw, WifiOff, X } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAllData());
  const [activeTab, setActiveTab] = useState<AppTab>('cash_counter');

  // Modals
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [newModalInitialMode, setNewModalInitialMode] = useState<'bill' | 'online_order'>('bill');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingOrder, setEditingOrder] = useState<OnlineOrder | null>(null);
  const [completingOrder, setCompletingOrder] = useState<OnlineOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<OnlineOrder | null>(null);
  const [isFatCalcOpen, setIsFatCalcOpen] = useState(false);

  // Pre-selected customer for quick sale from Khata tab
  const [preSelectedCustomerPhone, setPreSelectedCustomerPhone] = useState<string>('');
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string>('');

  // PWA update & connectivity status
  const [updateReady, setUpdateReady] = useState(false);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Persist whenever data changes
  useEffect(() => {
    saveAllData(data);
  }, [data]);

  // Listen for instant Service Worker updates and network connectivity changes
  useEffect(() => {
    const handleUpdateReady = () => setUpdateReady(true);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('pwa-update-ready', handleUpdateReady);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('pwa-update-ready', handleUpdateReady);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate live expected drawer cash & online bank balance for today
  const todayDrawer = data.cashDrawer[todayStr] || {
    id: `drawer_${todayStr}`,
    date: todayStr,
    openingCash: 0,
    addedCash: 0,
    withdrawnCash: 0,
  };

  const todaySales = data.sales.filter((s) => s.date.startsWith(todayStr));
  const todayKhata = data.khataPayments.filter((kp) => kp.date.startsWith(todayStr));
  const todayPurchases = data.purchasesExpenses.filter((pe) => pe.date.startsWith(todayStr));

  const totalTodaySalesCash = todaySales.reduce((sum, s) => sum + s.cashReceived, 0);
  const totalTodayKhataCash = todayKhata
    .filter((kp) => kp.paymentMode === 'cash')
    .reduce((sum, kp) => sum + kp.amount, 0);
  const totalTodayPurchasesCash = todayPurchases
    .filter((pe) => pe.paymentMode === 'cash')
    .reduce((sum, pe) => sum + pe.totalAmount, 0);

  const liveDrawerCash =
    todayDrawer.openingCash +
    totalTodaySalesCash +
    totalTodayKhataCash +
    todayDrawer.addedCash -
    (totalTodayPurchasesCash + todayDrawer.withdrawnCash);

  const totalTodaySalesOnline = todaySales.reduce((sum, s) => sum + s.onlineReceived, 0);
  const totalTodayKhataOnline = todayKhata
    .filter((kp) => kp.paymentMode === 'online')
    .reduce((sum, kp) => sum + kp.amount, 0);
  const totalTodayPurchasesOnline = todayPurchases
    .filter((pe) => pe.paymentMode === 'online')
    .reduce((sum, pe) => sum + pe.totalAmount, 0);

  const liveOnlineBank =
    (todayDrawer.openingBank || 0) +
    totalTodaySalesOnline +
    totalTodayKhataOnline +
    (todayDrawer.addedBank || 0) -
    (totalTodayPurchasesOnline + (todayDrawer.withdrawnBank || 0));

  // Handlers
  const openNewModal = (mode: 'bill' | 'online_order' = 'bill') => {
    setEditingSale(null);
    setEditingOrder(null);
    setCompletingOrder(null);
    setPreSelectedCustomerPhone('');
    setPreSelectedCustomerId('');
    setNewModalInitialMode(mode);
    setIsNewSaleOpen(true);
  };

  const handleSaveSale = (
    saleToSave: Sale,
    updatedCustomer?: Customer | null,
    completedOrderId?: string
  ) => {
    let newCustomers = [...data.customers];
    if (updatedCustomer && updatedCustomer.id !== 'cust_walkin') {
      const existingIndex = data.customers.findIndex((c) => c.id === updatedCustomer.id);
      if (existingIndex >= 0) {
        newCustomers[existingIndex] = updatedCustomer;
      } else {
        newCustomers = [updatedCustomer, ...newCustomers];
      }
    }

    setData((prev) => {
      const isExisting = prev.sales.some((s) => s.id === saleToSave.id);
      const newSales = isExisting
        ? prev.sales.map((s) => (s.id === saleToSave.id ? saleToSave : s))
        : [saleToSave, ...prev.sales];

      const updatedOrders = completedOrderId
        ? (prev.onlineOrders || []).map((ord) =>
            ord.id === completedOrderId
              ? {
                  ...ord,
                  status: 'delivered' as const,
                  deliveredAt: saleToSave.date,
                  completedSaleId: saleToSave.id,
                  completedInvoiceNo: saleToSave.invoiceNo,
                  customerId: saleToSave.customerId,
                  customerName: saleToSave.customerName,
                  customerPhone: saleToSave.customerPhone,
                }
              : ord
          )
        : prev.onlineOrders || [];

      return {
        ...prev,
        sales: newSales,
        customers: newCustomers,
        onlineOrders: updatedOrders,
      };
    });

    setEditingSale(null);
    setCompletingOrder(null);
    // Immediately open invoice view so user can print or send on WhatsApp
    setSelectedInvoice(saleToSave);
  };

  const handleSaveOnlineOrder = (orderToSave: OnlineOrder, customerToSync?: Customer | null) => {
    let newCustomers = [...data.customers];
    if (customerToSync && customerToSync.id !== 'cust_walkin') {
      const existingIndex = data.customers.findIndex((c) => c.id === customerToSync.id);
      if (existingIndex >= 0) {
        newCustomers[existingIndex] = customerToSync;
      } else {
        newCustomers = [customerToSync, ...newCustomers];
      }
    }

    setData((prev) => {
      const currentOrders = prev.onlineOrders || [];
      const isExisting = currentOrders.some((o) => o.id === orderToSave.id);
      const nextOrders = isExisting
        ? currentOrders.map((o) => (o.id === orderToSave.id ? orderToSave : o))
        : [orderToSave, ...currentOrders];

      return {
        ...prev,
        onlineOrders: nextOrders,
        customers: newCustomers,
      };
    });

    setEditingOrder(null);
    // Immediately show Order Receipt & WhatsApp confirmation share sheet
    setSelectedOrderReceipt(orderToSave);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OnlineOrderStatus) => {
    setData((prev) => ({
      ...prev,
      onlineOrders: (prev.onlineOrders || []).map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: newStatus,
              readyAt: newStatus === 'ready' ? ord.readyAt || new Date().toISOString() : ord.readyAt,
            }
          : ord
      ),
    }));
    setSelectedOrderReceipt((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            status: newStatus,
            readyAt: newStatus === 'ready' ? prev.readyAt || new Date().toISOString() : prev.readyAt,
          }
        : prev
    );
  };

  const handleDeleteOnlineOrder = (orderId: string) => {
    setData((prev) => ({
      ...prev,
      onlineOrders: (prev.onlineOrders || []).filter((ord) => ord.id !== orderId),
    }));
  };

  const handleDeliverOnlineOrder = (order: OnlineOrder) => {
    setSelectedOrderReceipt(null);
    setEditingSale(null);
    setEditingOrder(null);
    setCompletingOrder(order);
    setNewModalInitialMode('bill');
    setIsNewSaleOpen(true);
  };

  const handleEditOnlineOrder = (order: OnlineOrder) => {
    setEditingSale(null);
    setCompletingOrder(null);
    setEditingOrder(order);
    setNewModalInitialMode('online_order');
    setIsNewSaleOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingOrder(null);
    setCompletingOrder(null);
    setNewModalInitialMode('bill');
    setEditingSale(sale);
    setIsNewSaleOpen(true);
  };

  const handleDeleteSale = (sale: Sale) => {
    let newCustomers = [...data.customers];
    const custIndex = newCustomers.findIndex(
      (c) =>
        c.id === sale.customerId ||
        (sale.customerPhone && c.phone === sale.customerPhone)
    );
    if (custIndex >= 0) {
      const c = newCustomers[custIndex];
      const gheeKg = sale.loyaltySchemeActivatedKg || 0;
      const restoredPending =
        c.pendingBalance - (sale.pendingAmount || 0) + (sale.previousUdhaarCleared || 0);
      const restoredAdvance =
        (c.advanceBalance || 0) + (sale.advanceUsed || 0) - (sale.extraPaymentAdded || 0);
      newCustomers[custIndex] = {
        ...c,
        pendingBalance: Math.max(0, Math.round(restoredPending * 100) / 100),
        advanceBalance: Math.max(0, Math.round(restoredAdvance * 100) / 100),
        totalPurchases: Math.max(0, c.totalPurchases - sale.totalAmount),
        totalGheeBoughtKg: Math.max(0, Math.round((c.totalGheeBoughtKg - gheeKg) * 1000) / 1000),
      };
    }

    setData((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== sale.id),
      customers: newCustomers,
    }));
  };

  const handleReceivePayment = (newPayment: KhataPayment, updatedCustomer: Customer) => {
    const customerIndex = data.customers.findIndex((c) => c.id === updatedCustomer.id);
    const newCustomers = [...data.customers];
    if (customerIndex >= 0) {
      newCustomers[customerIndex] = updatedCustomer;
    }

    setData((prev) => ({
      ...prev,
      khataPayments: [newPayment, ...prev.khataPayments],
      customers: newCustomers,
    }));
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      ),
      sales: prev.sales.map((s) =>
        s.customerId === updatedCustomer.id
          ? {
              ...s,
              customerName: updatedCustomer.name,
              customerPhone: updatedCustomer.phone,
            }
          : s
      ),
      khataPayments: prev.khataPayments.map((kp) =>
        kp.customerId === updatedCustomer.id
          ? {
              ...kp,
              customerName: updatedCustomer.name,
              customerPhone: updatedCustomer.phone,
            }
          : kp
      ),
      onlineOrders: (prev.onlineOrders || []).map((ord) =>
        ord.customerId === updatedCustomer.id
          ? {
              ...ord,
              customerName: updatedCustomer.name,
              customerPhone: updatedCustomer.phone,
            }
          : ord
      ),
    }));
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setData((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));
  };

  const handleAddPurchase = (newPurchase: PurchaseExpense) => {
    setData((prev) => ({
      ...prev,
      purchasesExpenses: [newPurchase, ...prev.purchasesExpenses],
    }));
  };

  const handleUpdatePurchase = (updatedPurchase: PurchaseExpense) => {
    setData((prev) => ({
      ...prev,
      purchasesExpenses: prev.purchasesExpenses.map((p) =>
        p.id === updatedPurchase.id ? updatedPurchase : p
      ),
    }));
  };

  const handleDeletePurchase = (id: string) => {
    setData((prev) => ({
      ...prev,
      purchasesExpenses: prev.purchasesExpenses.filter((p) => p.id !== id),
    }));
  };

  const handleUpdateDrawer = (date: string, entry: CashDrawerEntry) => {
    setData((prev) => ({
      ...prev,
      cashDrawer: {
        ...prev.cashDrawer,
        [date]: entry,
      },
    }));
  };

  const handleUpdateDenominations = (date: string, counts: DenominationCount) => {
    setData((prev) => ({
      ...prev,
      denominations: {
        ...prev.denominations,
        [date]: counts,
      },
    }));
  };

  const handleUpdateSettings = (newSettings: BusinessSettings) => {
    setData((prev) => ({ ...prev, settings: newSettings }));
  };

  const handleUpdateProducts = (newProducts: ProductItem[]) => {
    setData((prev) => ({ ...prev, products: newProducts }));
  };

  const handleExportBackup = () => {
    exportBackupJSON(data);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.settings && parsed.sales) {
          const normalized = {
            ...parsed,
            onlineOrders: Array.isArray(parsed.onlineOrders) ? parsed.onlineOrders : [],
          };
          setData(normalized);
          saveAllData(normalized);
        }
      } catch (err) {
        console.error('Could not read backup file:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    const sample = resetToSampleData();
    setData(sample);
  };

  const handleResetToZero = () => {
    const zeroData = resetToZeroData(data.settings, data.products);
    setData(zeroData);
  };

  const handleSelectCustomerForSale = (cust: Customer) => {
    setEditingSale(null);
    setEditingOrder(null);
    setCompletingOrder(null);
    setNewModalInitialMode('bill');
    setPreSelectedCustomerPhone(cust.phone);
    setPreSelectedCustomerId(cust.id);
    setIsNewSaleOpen(true);
  };

  const pendingCustomerCount = data.customers.filter((c) => c.pendingBalance > 0).length;
  const pendingOrderCount = (data.onlineOrders || []).filter((o) => o.status !== 'delivered').length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-amber-200">
      {/* Top Navbar */}
      <Navbar
        settings={data.settings}
        products={data.products}
        expectedDrawerCash={liveDrawerCash}
        onlineBankBalance={liveOnlineBank}
        onOpenNewSale={() => openNewModal('bill')}
        onOpenFatCalculator={() => setIsFatCalcOpen(true)}
        onUpdateSettings={handleUpdateSettings}
        onUpdateProducts={handleUpdateProducts}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetSample={handleResetSample}
        onResetToZero={handleResetToZero}
      />

      {/* PWA Update Ready & Offline Banners */}
      {updateReady && (
        <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            <span>New app version is ready! Tap reload to see the latest updates.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded-lg bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition cursor-pointer"
            >
              Update Now
            </button>
            <button
              type="button"
              onClick={() => setUpdateReady(false)}
              className="p-1 text-emerald-100 hover:text-white cursor-pointer"
              aria-label="Dismiss update banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isOffline && (
        <div className="bg-stone-800 text-amber-200 px-4 py-1.5 text-[11px] font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Bills &amp; Khata continue working and are saved on this device.</span>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'cash_counter' && (
          <CashCounterTab
            settings={data.settings}
            sales={data.sales}
            khataPayments={data.khataPayments}
            purchasesExpenses={data.purchasesExpenses}
            cashDrawer={data.cashDrawer}
            denominations={data.denominations}
            customers={data.customers}
            products={data.products}
            onUpdateDrawer={handleUpdateDrawer}
            onUpdateDenominations={handleUpdateDenominations}
            onOpenNewSale={() => openNewModal('bill')}
          />
        )}

        {activeTab === 'orders' && (
          <PendingOrdersTab
            orders={data.onlineOrders || []}
            sales={data.sales}
            customers={data.customers}
            settings={data.settings}
            onOpenNewOrder={() => openNewModal('online_order')}
            onEditOrder={handleEditOnlineOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeliverAndBill={handleDeliverOnlineOrder}
            onViewOrderReceipt={(order) => setSelectedOrderReceipt(order)}
            onViewFinalBill={(sale) => setSelectedInvoice(sale)}
            onDeleteOrder={handleDeleteOnlineOrder}
          />
        )}

        {activeTab === 'sales' && (
          <SalesLedgerTab
            sales={data.sales}
            settings={data.settings}
            onViewInvoice={(sale) => setSelectedInvoice(sale)}
            onOpenNewSale={() => openNewModal('bill')}
            onEditSale={handleEditSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === 'khata' && (
          <CustomerKhataTab
            customers={data.customers}
            sales={data.sales}
            khataPayments={data.khataPayments}
            settings={data.settings}
            shopName={data.settings.shopName}
            onReceivePayment={handleReceivePayment}
            onSelectCustomerForSale={handleSelectCustomerForSale}
            onUpdateCustomer={handleUpdateCustomer}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesExpensesTab
            purchasesExpenses={data.purchasesExpenses}
            onAddPurchase={handleAddPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsSummaryTab
            settings={data.settings}
            sales={data.sales}
            khataPayments={data.khataPayments}
            purchasesExpenses={data.purchasesExpenses}
            cashDrawer={data.cashDrawer}
            customers={data.customers}
            products={data.products}
          />
        )}
      </main>

      {/* Floating Quick Action Button on Mobile */}
      <button
        id="btn-floating-new-sale"
        onClick={() => openNewModal('bill')}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-xl flex items-center justify-center border-2 border-white transition cursor-pointer"
        title="New Bill or Online Order"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewSale={() => openNewModal('bill')}
        pendingCustomerCount={pendingCustomerCount}
        pendingOrderCount={pendingOrderCount}
      />

      {/* New / Edit Sale & Online Order Modal */}
      {isNewSaleOpen && (
        <NewSaleModal
          isOpen={isNewSaleOpen}
          onClose={() => {
            setIsNewSaleOpen(false);
            setEditingSale(null);
            setEditingOrder(null);
            setCompletingOrder(null);
            setPreSelectedCustomerPhone('');
            setPreSelectedCustomerId('');
          }}
          products={data.products}
          customers={data.customers}
          settings={data.settings}
          initialCustomerPhone={preSelectedCustomerPhone}
          initialCustomerId={preSelectedCustomerId}
          saleToEdit={editingSale}
          initialMode={newModalInitialMode}
          orderToEdit={editingOrder}
          orderToComplete={completingOrder}
          onSaveSale={handleSaveSale}
          onSaveOnlineOrder={handleSaveOnlineOrder}
        />
      )}

      {/* Online Order Receipt & WhatsApp Notification Modal */}
      {selectedOrderReceipt && (
        <OnlineOrderReceiptModal
          order={selectedOrderReceipt}
          customer={
            data.customers.find(
              (c) =>
                c.id === selectedOrderReceipt.customerId ||
                (selectedOrderReceipt.customerPhone &&
                  c.phone === selectedOrderReceipt.customerPhone)
            ) || null
          }
          settings={data.settings}
          onClose={() => setSelectedOrderReceipt(null)}
          onChangeStatus={handleUpdateOrderStatus}
          onDeliverAndBill={handleDeliverOnlineOrder}
        />
      )}

      {/* Invoice Viewer & Print/WhatsApp Modal */}
      {selectedInvoice && (
        <InvoiceModal
          sale={selectedInvoice}
          settings={data.settings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Quick Fat Test Calculator Modal */}
      {isFatCalcOpen && (
        <QuickFatTestCalculatorModal
          isOpen={isFatCalcOpen}
          onClose={() => setIsFatCalcOpen(false)}
          onApplyToSale={(calc) => {
            const creamSku =
              data.products.find((p) => p.isFatTestBased || p.type === 'cream') ||
              data.products[0];
            const sampleSale: Sale = {
              id: `sale_${Date.now()}`,
              invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
              customerId: 'cust_walkin',
              customerName: '',
              customerPhone: '',
              date: new Date().toISOString(),
              items: [
                {
                  productId: creamSku.id,
                  productName: creamSku.name,
                  quantityKg: calc.weightKg,
                  ratePerKg: calc.effectiveRatePerKg,
                  total: calc.totalAmount,
                  isGhee: false,
                  schemeEligible: false,
                  isFatTestBased: true,
                  fatTest: calc.testPercent,
                  base51Rate: calc.base51Rate,
                  expectedGheeKg: calc.expectedGheeKg,
                },
              ],
              subtotal: calc.totalAmount,
              discountPercent: 0,
              discountAmount: 0,
              totalAmount: calc.totalAmount,
              paymentMode: 'cash',
              cashReceived: calc.totalAmount,
              onlineReceived: 0,
              pendingAmount: 0,
              isLoyaltyDiscountApplied: false,
            };
            setEditingSale(sampleSale);
            setIsNewSaleOpen(true);
            setIsFatCalcOpen(false);
          }}
          onApplyToPurchase={(calc) => {
            const newEntry: PurchaseExpense = {
              id: `pur_${Date.now()}`,
              date: new Date().toISOString(),
              category: 'raw_cream',
              title: 'Raw Dairy Cream (कच्ची मलाई)',
              supplierOrPayee: 'Cream Supplier / Dairy',
              quantityKg: calc.weightKg,
              ratePerKg: calc.effectiveRatePerKg,
              totalAmount: calc.totalAmount,
              paymentMode: 'cash',
              isFatTestBased: true,
              fatTest: calc.testPercent,
              base51Rate: calc.base51Rate,
              expectedGheeKg: calc.expectedGheeKg,
              notes: `${calc.testPercent}% Test Raw Cream (${calc.expectedGheeKg}kg ghee yield) @ ₹${calc.base51Rate}/kg 51-भाव`,
            };
            handleAddPurchase(newEntry);
            setActiveTab('purchases');
            setIsFatCalcOpen(false);
          }}
        />
      )}
    </div>
  );
}
