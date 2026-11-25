import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  Plus,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Store,
  Phone,
  X,
  Smartphone,
  Package,
  ShieldCheck,
  Tag,
  MessageSquare,
  Check,
  FlaskConical,
} from 'lucide-react';
import { BusinessSettings, ProductItem, WhatsAppTemplates } from '../types';
import { formatCurrency } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';
import { SkuManager } from './SkuManager';
import { WhatsAppTemplatesSettings } from './WhatsAppTemplatesSettings';

interface NavbarProps {
  settings: BusinessSettings;
  products: ProductItem[];
  expectedDrawerCash: number;
  onlineBankBalance: number;
  onOpenNewSale: () => void;
  onOpenFatCalculator?: () => void;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onUpdateProducts: (newProducts: ProductItem[]) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetSample: () => void;
  onResetToZero: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  products,
  expectedDrawerCash,
  onlineBankBalance,
  onOpenNewSale,
  onOpenFatCalculator,
  onUpdateSettings,
  onUpdateProducts,
  onExportBackup,
  onImportBackup,
  onResetSample,
  onResetToZero,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'skus' | 'shop' | 'whatsapp' | 'backup'>('skus');
  const [tempSettings, setTempSettings] = useState<BusinessSettings>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showStartAfreshModal, setShowStartAfreshModal] = useState(false);
  const [hasDownloadedBackupInModal, setHasDownloadedBackupInModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    setShowSettingsModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      setShowSettingsModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-900 text-white shadow-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-xs border border-amber-300/30 shrink-0">
              🧈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate max-w-[180px] sm:max-w-xs">
                  {settings.shopName}
                </h1>
                <span className="hidden md:inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Desi Ghee Ledger
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Pure Ghee Processing & Wholesale-Retail Shop Manager
              </p>
            </div>
          </div>

          {/* Quick Glances in Header */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            {/* Cash in Drawer Quick Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-bold">
                  Cash In Drawer
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {formatCurrency(expectedDrawerCash)}
                </span>
              </div>
            </div>

            {/* Bank Online Quick Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-bold">
                  Bank / Online
                </span>
                <span className="font-mono font-bold text-indigo-300">
                  {formatCurrency(onlineBankBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions: Install, New Sale, Settings */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            {onOpenFatCalculator && (
              <button
                id="btn-nav-fat-calc"
                onClick={onOpenFatCalculator}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 font-bold text-xs border border-stone-700 transition cursor-pointer"
                title="Raw Cream 51-Test Calculator (मलाई टेस्टिंग व भाव)"
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">51-भाव Test</span>
              </button>
            )}

            <button
              id="btn-nav-new-sale"
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline font-bold">New Bill (नया बिल)</span>
            </button>

            <button
              onClick={() => {
                setTempSettings(settings);
                setShowSettingsModal(true);
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
              title="Shop Settings & Backup"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings & Local Backup Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-stone-200 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Shop Settings & Configurations</h3>
                  <p className="text-[11px] text-stone-500">
                    Manage products, prices, shop details, WhatsApp templates, and backup
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-200 mt-3 shrink-0 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSettingsTab('skus')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  settingsTab === 'skus'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/70'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>SKUs & Rate List</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-black">
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('shop')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  settingsTab === 'shop'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/70'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Shop Profile & Scheme</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('whatsapp')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  settingsTab === 'whatsapp'
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Messages (व्हाट्सएप)</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('backup')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  settingsTab === 'backup'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/70'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Data Backup</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto py-4">
              {settingsTab === 'skus' && (
                <SkuManager
                  products={products}
                  onUpdateProducts={onUpdateProducts}
                  gheeSchemeDiscountPercent={tempSettings.gheeSchemeDiscountPercent}
                  loyaltySchemeEnabled={tempSettings.loyaltySchemeEnabled !== false}
                />
              )}

              {settingsTab === 'shop' && (
                <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs text-stone-800">
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Shop Name (दुकान का नाम)
                    </label>
                    <input
                      type="text"
                      required
                      value={tempSettings.shopName}
                      onChange={(e) => setTempSettings({ ...tempSettings, shopName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Owner / Father Name (मालिक का नाम)
                    </label>
                    <input
                      type="text"
                      value={tempSettings.ownerName}
                      onChange={(e) => setTempSettings({ ...tempSettings, ownerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Phone (फोन नंबर)</label>
                      <input
                        type="text"
                        value={tempSettings.phone}
                        onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Scheme Discount %
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={tempSettings.gheeSchemeDiscountPercent}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            gheeSchemeDiscountPercent: parseInt(e.target.value, 10) || 5,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Loyalty Scheme Toggle on/off */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-900 block text-xs">
                          Customer Loyalty Scheme (ग्राहक डिस्काउंट स्कीम)
                        </span>
                        <span className="text-[11px] text-stone-600 block">
                          5% discount for repeat ghee purchases within scheme validity window
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-3">
                        <input
                          id="toggle-loyalty-scheme"
                          type="checkbox"
                          checked={tempSettings.loyaltySchemeEnabled !== false}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              loyaltySchemeEnabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                    <div className="text-[11px] text-amber-900/90 font-medium">
                      {tempSettings.loyaltySchemeEnabled !== false ? (
                        <span className="text-emerald-700">✓ Scheme is ON (सक्रिय है - बिल पर डिस्काउंट लागू होगा)</span>
                      ) : (
                        <span className="text-stone-500">✕ Scheme is OFF (बंद है - किसी बिल पर स्कीम डिस्काउंट नहीं लगेगा)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Shop Address</label>
                    <input
                      type="text"
                      value={tempSettings.address}
                      onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                    >
                      Save Shop Profile
                    </button>
                  </div>
                </form>
              )}

              {settingsTab === 'whatsapp' && (
                <div className="space-y-4">
                  <WhatsAppTemplatesSettings
                    templates={(tempSettings.whatsAppTemplates as WhatsAppTemplates) || {}}
                    onChangeTemplates={(newTpl) => {
                      setTempSettings({
                        ...tempSettings,
                        whatsAppTemplates: newTpl,
                      });
                    }}
                    shopName={tempSettings.shopName}
                    shopPhone={tempSettings.phone}
                  />

                  <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-500">
                      ✓ Changes will apply to all WhatsApp bills and payment receipts immediately.
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(false)}
                        className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings(tempSettings);
                          setShowSettingsModal(false);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save WhatsApp Formats</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'backup' && (
                <div className="space-y-4 text-xs text-stone-800">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-stone-900 block text-sm">
                      Local Storage & Data Safety (बैकअप)
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      All your sales, customer khata, daily drawers, and custom SKUs are stored 100% locally and safely in your browser. You can download a backup file anytime or transfer it to another phone/computer.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={onExportBackup}
                        className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-amber-50 font-bold flex items-center justify-center gap-2 text-stone-800 transition cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4 text-amber-600" />
                        <span>Download Full Backup (JSON)</span>
                      </button>

                      <label className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-indigo-50 font-bold flex items-center justify-center gap-2 text-stone-800 cursor-pointer transition shadow-xs">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>Restore Backup File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Start Afresh / Reset to Zero Section */}
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center font-black text-xs">
                        0
                      </div>
                      <span className="font-bold text-rose-900 block text-sm">
                        Start Afresh & Clear Data (सब शून्य करें - नया आरंभ)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-rose-800 leading-relaxed">
                      Delete current sales, customer khata ledger entries, purchase expenses, and daily cash drawer history to start afresh from zero (₹0). Your shop name and SKU price list will remain saved.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setHasDownloadedBackupInModal(false);
                          setShowStartAfreshModal(true);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 transition cursor-pointer shadow-xs text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Start Afresh / Reset to Zero (नया खाता शुरू करें)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-stone-500 block">Need sample test data?</span>
                      <span className="text-[10px] text-stone-400">Loads demo records for practice</span>
                    </div>
                    {showResetConfirm ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                        <span className="text-[11px] text-rose-800 font-bold">Load demo data?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onResetSample();
                            setShowResetConfirm(false);
                            setShowSettingsModal(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Yes, Load Demo
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-2 py-1 rounded-lg border border-stone-300 text-stone-600 text-[11px] hover:bg-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset to Demo Data</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (for SKU tab or quick close) */}
            {settingsTab === 'skus' && (
              <div className="pt-3 border-t border-stone-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 cursor-pointer transition shadow-xs"
                >
                  Done (हो गया)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Afresh & Backup Warning Modal */}
      {showStartAfreshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-tight">
                    Backup Before Fresh Start (बैकअप लें)
                  </h3>
                  <span className="text-xs text-amber-700 font-medium">
                    Strongly recommended before starting afresh
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowStartAfreshModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Message */}
            <div className="space-y-2 text-xs text-stone-700">
              <p className="leading-relaxed">
                You are choosing to delete current transactions and reset all balances to <strong>zero (₹0)</strong>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1 text-[11.5px]">
                <span className="font-bold block">💡 Important Notice / महत्वपूर्ण सूचना:</span>
                <span>
                  Please download a backup file of your current data before proceeding. If you ever need your previous sales bills, customer khata ledger, or expenses, you can restore them from this file anytime.
                </span>
              </div>
            </div>

            {/* Direct Backup Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onExportBackup();
                  setHasDownloadedBackupInModal(true);
                }}
                className={`w-full py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs ${
                  hasDownloadedBackupInModal
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-stone-900 hover:bg-stone-800 text-white border-stone-900 shadow-xs'
                }`}
              >
                {hasDownloadedBackupInModal ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Backup Downloaded! (बैकअप फाइल डाउनलोड हो गई)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Download Backup Now (पहले बैकअप डाउनलोड करें)</span>
                  </>
                )}
              </button>
            </div>

            {/* Final Action Buttons */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowStartAfreshModal(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 text-xs cursor-pointer"
              >
                Cancel & Keep Data (रद्द करें)
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetToZero();
                  setShowStartAfreshModal(false);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Start Afresh (सब 0 करें)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
