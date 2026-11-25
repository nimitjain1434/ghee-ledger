import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Package,
  Sparkles,
  AlertCircle,
  Tag,
  IndianRupee,
} from 'lucide-react';
import { ProductItem, ProductType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { calculateCreamRateFromGheeYield } from '../utils/creamCalculator';

interface SkuManagerProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
  gheeSchemeDiscountPercent?: number;
  loyaltySchemeEnabled?: boolean;
}

export const SkuManager: React.FC<SkuManagerProps> = ({
  products,
  onUpdateProducts,
  gheeSchemeDiscountPercent = 5,
  loyaltySchemeEnabled = true,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New SKU form state
  const [newName, setNewName] = useState('');
  const [newNameHindi, setNewNameHindi] = useState('');
  const [newType, setNewType] = useState<ProductType>('butter');
  const [newRate, setNewRate] = useState<string>('');
  const [newUnit, setNewUnit] = useState<'kg' | 'pack' | 'tin'>('kg');
  const [newIsGhee, setNewIsGhee] = useState(false);
  const [newSchemeEligible, setNewSchemeEligible] = useState(true);
  const [newTestPercentage, setNewTestPercentage] = useState<string>('51');
  const [newBaseRate, setNewBaseRate] = useState<string>('335');
  const [errorMessage, setErrorMessage] = useState('');

  // Edit SKU form state
  const [editName, setEditName] = useState('');
  const [editNameHindi, setEditNameHindi] = useState('');
  const [editType, setEditType] = useState<ProductType>('other');
  const [editRate, setEditRate] = useState<string>('');
  const [editUnit, setEditUnit] = useState<'kg' | 'pack' | 'tin'>('kg');
  const [editIsGhee, setEditIsGhee] = useState(false);
  const [editSchemeEligible, setEditSchemeEligible] = useState(true);
  const [editTestPercentage, setEditTestPercentage] = useState<string>('51');
  const [editBaseRate, setEditBaseRate] = useState<string>('335');
  const [editError, setEditError] = useState('');

  // Delete SKU confirmation state (In-App dialog, no window.confirm!)
  const [skuToDelete, setSkuToDelete] = useState<ProductItem | null>(null);
  const [catalogError, setCatalogError] = useState('');

  // Quick preset helper when user picks a type
  const handleTypeChange = (type: ProductType) => {
    setNewType(type);
    if (type === 'desi_ghee' || type === 'wholesale_ghee') {
      setNewIsGhee(true);
      setNewSchemeEligible(true);
    } else if (type === 'cream') {
      setNewIsGhee(false);
      setNewSchemeEligible(false);
      if (!newRate) {
        setNewRate('335');
        setNewBaseRate('335');
      }
    } else {
      setNewIsGhee(false);
      setNewSchemeEligible(false);
    }
  };

  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter an SKU or product name.');
      return;
    }

    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setErrorMessage('Please enter a valid default rate/price greater than 0.');
      return;
    }

    const isPhysicalGhee =
      newType === 'desi_ghee' ||
      newType === 'wholesale_ghee' ||
      /(ghee|घी)/i.test(trimmedName) ||
      newIsGhee;

    const isCreamType = newType === 'cream';
    const parsedBaseRate = isCreamType ? (parseFloat(newBaseRate) || parsedRate) : undefined;
    const parsedTestPercentage = isCreamType ? (parseFloat(newTestPercentage) || 51) : undefined;

    const newSku: ProductItem = {
      id: `prod_${Date.now()}`,
      name: trimmedName,
      nameHindi: newNameHindi.trim() || trimmedName,
      type: newType,
      defaultRatePerKg: Math.round(parsedRate),
      unit: newUnit,
      isGhee: isPhysicalGhee,
      schemeEligible: loyaltySchemeEnabled ? (isPhysicalGhee && newSchemeEligible) : false,
      baseRatePerKg: parsedBaseRate,
      testPercentage: parsedTestPercentage,
    };

    onUpdateProducts([...products, newSku]);

    // Reset form
    setNewName('');
    setNewNameHindi('');
    setNewRate('');
    setNewType('butter');
    setNewUnit('kg');
    setNewIsGhee(false);
    setNewSchemeEligible(true);
    setNewTestPercentage('51');
    setNewBaseRate('335');
    setIsAdding(false);
  };

  const startEditing = (p: ProductItem) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditNameHindi(p.nameHindi || '');
    setEditType(p.type);
    setEditRate(p.defaultRatePerKg.toString());
    setEditUnit(p.unit);
    const isPhysicalGhee =
      p.isGhee ||
      p.type === 'desi_ghee' ||
      p.type === 'wholesale_ghee' ||
      /(ghee|घी)/i.test(p.name);
    setEditIsGhee(isPhysicalGhee);
    // If scheme is toggled off in settings, automatically set to false and disabled!
    setEditSchemeEligible(loyaltySchemeEnabled && p.schemeEligible !== false && isPhysicalGhee);
    setEditTestPercentage((p.testPercentage || 51).toString());
    setEditBaseRate((p.baseRatePerKg || p.defaultRatePerKg || 335).toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError('');
  };

  const handleSaveEdit = (id: string) => {
    setEditError('');
    const trimmedName = editName.trim();
    const parsedRate = parseFloat(editRate);
    if (!trimmedName) {
      setEditError('Please enter an SKU or product name.');
      return;
    }
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setEditError('Please enter a valid default rate/price greater than 0.');
      return;
    }

    const isCreamType = editType === 'cream';
    const parsedBaseRate = isCreamType ? (parseFloat(editBaseRate) || parsedRate) : undefined;
    const parsedTestPercentage = isCreamType ? (parseFloat(editTestPercentage) || 51) : undefined;

    const updated = products.map((p) => {
      if (p.id !== id) return p;
      const isPhysicalGhee =
        editType === 'desi_ghee' ||
        editType === 'wholesale_ghee' ||
        /(ghee|घी)/i.test(trimmedName) ||
        editIsGhee ||
        p.isGhee;

      return {
        ...p,
        name: trimmedName,
        nameHindi: editNameHindi.trim() || trimmedName,
        type: editType,
        defaultRatePerKg: Math.round(parsedRate),
        unit: editUnit,
        isGhee: isPhysicalGhee,
        schemeEligible: loyaltySchemeEnabled ? (isPhysicalGhee && editSchemeEligible) : false,
        baseRatePerKg: parsedBaseRate,
        testPercentage: parsedTestPercentage,
      };
    });

    onUpdateProducts(updated);
    setEditingId(null);
  };

  const initiateDeleteSku = (sku: ProductItem) => {
    setCatalogError('');
    if (products.length <= 1) {
      setCatalogError('At least 1 SKU is required in your catalog to create bills. You cannot delete the last remaining SKU.');
      return;
    }
    setSkuToDelete(sku);
  };

  const confirmDeleteSku = () => {
    if (!skuToDelete) return;
    const remaining = products.filter((p) => p.id !== skuToDelete.id);
    onUpdateProducts(remaining);
    setSkuToDelete(null);
    setCatalogError('');
  };

  const getTypeLabel = (type: ProductType): { label: string; bg: string; text: string } => {
    switch (type) {
      case 'desi_ghee':
        return { label: 'Desi Ghee (देसी घी)', bg: 'bg-amber-100', text: 'text-amber-800' };
      case 'butter':
        return { label: 'Butter / मक्खन', bg: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'cream':
        return { label: 'Cream / मलाई', bg: 'bg-orange-100', text: 'text-orange-800' };
      case 'wholesale_ghee':
        return { label: 'Wholesale Ghee (थोक)', bg: 'bg-stone-200', text: 'text-stone-800' };
      default:
        return { label: 'Dairy / Other', bg: 'bg-blue-100', text: 'text-blue-800' };
    }
  };

  return (
    <div className="space-y-4 text-xs text-stone-800">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Product SKUs & Rate List (सामान व रेट सूची)</span>
          </h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Manage all dairy items, butter, cream, and ghee sold in your shop with default rates.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setErrorMessage('');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SKU (+ सामान जोड़ें)</span>
          </button>
        )}
      </div>

      {/* New SKU Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSku}
          className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <Plus className="w-4 h-4 text-amber-700" />
              <span>New SKU Details (नया सामान / वस्तु जोड़ें)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-amber-700 hover:text-amber-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                SKU / Item Name in English *
              </label>
              <input
                type="text"
                placeholder="e.g. Fresh Butter, Cow Cream, Paneer"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Hindi Name (हिंदी नाम - Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ताज़ा मक्खन / मलाई"
                value={newNameHindi}
                onChange={(e) => setNewNameHindi(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Category / Item Type
              </label>
              <select
                value={newType}
                onChange={(e) => handleTypeChange(e.target.value as ProductType)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:border-amber-500 font-medium"
              >
                <option value="butter">Butter / मक्खन</option>
                <option value="cream">Cream / मलाई</option>
                <option value="desi_ghee">Desi Ghee (देसी घी)</option>
                <option value="wholesale_ghee">Wholesale Ghee (थोक)</option>
                <option value="other">Other Dairy Product</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Default Rate / Price (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 520"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:border-amber-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Selling Unit</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value as 'kg' | 'pack' | 'tin')}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:border-amber-500 font-medium"
              >
                <option value="kg">Per kg (प्रति किलो)</option>
                <option value="pack">Per Pack (पैकेट)</option>
                <option value="tin">Per Tin / Pipa (पीपा/टिन)</option>
              </select>
            </div>
          </div>

          {/* Cream Realized Ghee-Yield Configuration */}
          {newType === 'cream' && (
            <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5 text-xs">
                  <span>🥛 Realized Ghee-Yield Pricing Model (मलाई घी-यील्ड फॉर्मूला)</span>
                </span>
                <span className="text-[10px] font-mono bg-orange-100 text-orange-900 px-2 py-0.5 rounded font-semibold">
                  Mandi Standard: 51% test = 500g ghee
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                1 kg of 51% test cream yields 500g pure ghee. Rates for any test percentage are calculated from realized ghee yield (Yield = Test - 1.0%).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                    Base Rate (51% Test Cream) ₹
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newBaseRate}
                    onChange={(e) => {
                      setNewBaseRate(e.target.value);
                      setNewRate(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-orange-300 text-xs bg-white font-bold"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Implied Ghee: ₹{((parseFloat(newBaseRate) || 0) * 2).toFixed(2)}/kg
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                    Standard Default Test %
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="90"
                    step="any"
                    value={newTestPercentage}
                    onChange={(e) => setNewTestPercentage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-orange-300 text-xs bg-white font-bold"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Usually 51.0% in Mandi
                  </span>
                </div>
              </div>

              {/* Quick sample preview */}
              <div className="bg-white/90 border border-orange-200 rounded-lg p-2 text-[11px]">
                <span className="font-bold text-orange-900 block mb-1">
                  Sample Rates at Base ₹{newBaseRate || '335'}/kg:
                </span>
                <div className="grid grid-cols-4 gap-1 text-center font-mono">
                  {[51, 55, 58.5, 60].map((t) => {
                    const res = calculateCreamRateFromGheeYield(t, parseFloat(newBaseRate) || 335);
                    return (
                      <div key={t} className="bg-orange-50 rounded p-1 border border-orange-100">
                        <span className="text-[10px] text-stone-600 block">{t}% Test</span>
                        <span className="font-bold text-orange-950 block">₹{res.finalRatePerKg}</span>
                        <span className="text-[9px] text-stone-400 block">{res.gheeYieldGramsPerKg}g ghee</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Loyalty Scheme Qualification */}
          {!loyaltySchemeEnabled ? (
            <div className="bg-stone-100/90 border border-stone-200 rounded-lg p-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-600 block text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                  <span>Customer Loyalty Scheme ({gheeSchemeDiscountPercent}%)</span>
                </span>
                <span className="text-[11px] text-amber-800 font-medium block">
                  Automatically Disabled: Scheme is turned <strong>OFF</strong> in Shop Profile Settings.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider">
                Disabled
              </span>
            </div>
          ) : (
            <div className="bg-white/80 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900 block text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Qualifies for {gheeSchemeDiscountPercent}% Loyalty Scheme?</span>
                </span>
                <span className="text-[10px] text-stone-500 block">
                  Enable only for pure ghee items that extend or receive the repeat customer discount.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={newSchemeEligible}
                  onChange={(e) => setNewSchemeEligible(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Save SKU (सामान सेव करें)
            </button>
          </div>
        </form>
      )}

      {/* Catalog Error Banner */}
      {catalogError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{catalogError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCatalogError('')}
            className="p-1 rounded text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SKU Catalog List */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {products.map((p) => {
          const typeBadge = getTypeLabel(p.type);
          const isEditingThis = editingId === p.id;

          if (isEditingThis) {
            return (
              <div
                key={p.id}
                className="bg-amber-50/90 border-2 border-amber-400 rounded-xl p-3 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between font-bold text-amber-900 text-xs">
                  <span>Edit SKU ({p.name})</span>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {editError && (
                  <div className="bg-rose-100 border border-rose-300 text-rose-800 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                      Hindi Name
                    </label>
                    <input
                      type="text"
                      value={editNameHindi}
                      onChange={(e) => setEditNameHindi(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                      Type
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as ProductType)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      <option value="butter">Butter</option>
                      <option value="cream">Cream</option>
                      <option value="desi_ghee">Desi Ghee</option>
                      <option value="wholesale_ghee">Wholesale Ghee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                      Unit
                    </label>
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value as 'kg' | 'pack' | 'tin')}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="pack">pack</option>
                      <option value="tin">tin</option>
                    </select>
                  </div>
                </div>

                {/* Cream Realized Ghee-Yield Configuration */}
                {editType === 'cream' && (
                  <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-950 flex items-center gap-1 text-[11px]">
                        <span>🥛 Realized Ghee-Yield Pricing Model (मलाई घी-यील्ड)</span>
                      </span>
                      <span className="text-[10px] font-mono bg-orange-100 text-orange-900 px-1.5 py-0.5 rounded font-semibold">
                        51% test = 500g ghee
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-stone-700 text-[10px] mb-0.5">
                          Base Rate (51% Test) ₹
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={editBaseRate}
                          onChange={(e) => {
                            setEditBaseRate(e.target.value);
                            setEditRate(e.target.value);
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-orange-300 text-xs bg-white font-bold"
                        />
                        <span className="text-[9px] text-stone-500 block">
                          Implied Ghee: ₹{((parseFloat(editBaseRate) || 0) * 2).toFixed(2)}/kg
                        </span>
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 text-[10px] mb-0.5">
                          Default Test %
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="90"
                          step="any"
                          value={editTestPercentage}
                          onChange={(e) => setEditTestPercentage(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-orange-300 text-xs bg-white font-bold"
                        />
                        <span className="text-[9px] text-stone-500 block">
                          Standard 51.0%
                        </span>
                      </div>
                    </div>

                    {/* Quick sample preview */}
                    <div className="bg-white/90 border border-orange-200 rounded-lg p-1.5 text-[10px]">
                      <span className="font-bold text-orange-900 block mb-0.5">
                        Sample Rates at Base ₹{editBaseRate || '335'}/kg:
                      </span>
                      <div className="grid grid-cols-4 gap-1 text-center font-mono">
                        {[51, 55, 58.5, 60].map((t) => {
                          const res = calculateCreamRateFromGheeYield(t, parseFloat(editBaseRate) || 335);
                          return (
                            <div key={t} className="bg-orange-50 rounded p-0.5 border border-orange-100">
                              <span className="text-[9px] text-stone-600 block">{t}%</span>
                              <span className="font-bold text-orange-950 block">₹{res.finalRatePerKg}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {!loyaltySchemeEnabled ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        Loyalty Scheme is <strong>OFF</strong> in Shop Profile Settings (automatically disabled).
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editSchemeEligible}
                        onChange={(e) => setEditSchemeEligible(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-600"
                      />
                      <span>Eligible for {gheeSchemeDiscountPercent}% Loyalty Scheme</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={p.id}
              className="group bg-white border border-stone-200 hover:border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 transition shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-base shrink-0">
                  {p.type === 'butter' ? '🧈' : p.type === 'cream' ? '🥛' : p.isGhee ? '🪔' : '📦'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-stone-900 text-xs truncate">
                      {p.name}
                    </h5>
                    {p.nameHindi && p.nameHindi !== p.name && (
                      <span className="text-[11px] text-stone-500">
                        ({p.nameHindi})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge.bg} ${typeBadge.text}`}
                    >
                      {typeBadge.label}
                    </span>
                    {p.type === 'cream' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                        Base: ₹{p.baseRatePerKg || p.defaultRatePerKg} (51% test) · Ghee-Yield Model
                      </span>
                    )}
                    {loyaltySchemeEnabled && p.schemeEligible !== false && (p.isGhee || p.type === 'desi_ghee' || p.type === 'wholesale_ghee') ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{gheeSchemeDiscountPercent}% Scheme</span>
                      </span>
                    ) : !loyaltySchemeEnabled ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                        Scheme OFF
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400">
                        Standard
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-black text-amber-700 text-sm block">
                    {formatCurrency(p.defaultRatePerKg)}
                  </span>
                  <span className="text-[10px] text-stone-400 block uppercase font-medium">
                    per {p.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(p)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                    title="Edit SKU Name or Price"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => initiateDeleteSku(p)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete SKU"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Delete Confirmation Modal (Iframe-safe, no blocked window.confirm) */}
      {skuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-stone-900">Delete SKU?</h4>
                <p className="text-xs text-stone-600 font-semibold truncate">
                  {skuToDelete.name}
                  {skuToDelete.nameHindi && skuToDelete.nameHindi !== skuToDelete.name ? ` (${skuToDelete.nameHindi})` : ''}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Remove this SKU from your active catalog?
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Past completed sales bills and khata records will keep their existing history safely.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSkuToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 text-xs transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={confirmDeleteSku}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete SKU (हटाएं)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
