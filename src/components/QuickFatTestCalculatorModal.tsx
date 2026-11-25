import React, { useState } from 'react';
import {
  X,
  Calculator,
  ArrowRight,
  Sparkles,
  Percent,
  Weight,
  IndianRupee,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { calculateCreamPrice, calculateWeightFromAmount } from '../utils/creamFatHelper';
import { formatCurrency } from '../utils/formatters';

interface QuickFatTestCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToSale?: (calc: {
    testPercent: number;
    base51Rate: number;
    weightKg: number;
    effectiveRatePerKg: number;
    totalAmount: number;
    expectedGheeKg: number;
  }) => void;
  onApplyToPurchase?: (calc: {
    testPercent: number;
    base51Rate: number;
    weightKg: number;
    effectiveRatePerKg: number;
    totalAmount: number;
    expectedGheeKg: number;
  }) => void;
  initialBase51Rate?: number;
}

export const QuickFatTestCalculatorModal: React.FC<QuickFatTestCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyToSale,
  onApplyToPurchase,
  initialBase51Rate = 300,
}) => {
  const [base51Rate, setBase51Rate] = useState<string>(initialBase51Rate.toString());
  const [testPercent, setTestPercent] = useState<string>('53');
  const [weightKg, setWeightKg] = useState<string>('20');
  const [totalAmountInput, setTotalAmountInput] = useState<string>('');

  if (!isOpen) return null;

  const numBaseRate = parseFloat(base51Rate) || 0;
  const numTest = parseFloat(testPercent) || 51;
  const numWeight = parseFloat(weightKg) || 0;

  const result = calculateCreamPrice(numTest, numBaseRate, numWeight);

  const handleTestChange = (val: string) => {
    setTestPercent(val);
    const t = parseFloat(val) || 0;
    const w = parseFloat(weightKg) || 0;
    const r = parseFloat(base51Rate) || 0;
    const calc = calculateCreamPrice(t, r, w);
    setTotalAmountInput(calc.totalAmount.toString());
  };

  const handleBaseRateChange = (val: string) => {
    setBase51Rate(val);
    const t = parseFloat(testPercent) || 0;
    const w = parseFloat(weightKg) || 0;
    const r = parseFloat(val) || 0;
    const calc = calculateCreamPrice(t, r, w);
    setTotalAmountInput(calc.totalAmount.toString());
  };

  const handleWeightChange = (val: string) => {
    setWeightKg(val);
    const t = parseFloat(testPercent) || 0;
    const w = parseFloat(val) || 0;
    const r = parseFloat(base51Rate) || 0;
    const calc = calculateCreamPrice(t, r, w);
    setTotalAmountInput(calc.totalAmount.toString());
  };

  const handleAmountChange = (val: string) => {
    setTotalAmountInput(val);
    const amt = parseFloat(val) || 0;
    const t = parseFloat(testPercent) || 0;
    const r = parseFloat(base51Rate) || 0;
    if (amt > 0 && r > 0) {
      const w = calculateWeightFromAmount(amt, t, r);
      setWeightKg(w.toString());
    }
  };

  const quickTests = [50, 51, 52, 53, 54, 55, 56, 57, 58];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-stone-900 to-stone-850 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Raw Cream 51-Test Calculator (मलाई टेस्टिंग व भाव)
              </h3>
              <p className="text-[11px] text-stone-300">
                Dairy standard unitary fat test calculation (1% loss deduction)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-800 font-sans">
          {/* Quick preset tests */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
              Quick Select Fat Test % (फैट टेस्टिंग)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTests.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleTestChange(q.toString())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    parseFloat(testPercent) === q
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {q}%
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 51 Test Base Rate */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                51-Test Rate (₹/kg) *
                <span className="block text-[10px] font-normal text-stone-500">
                  (51 भाव रेट)
                </span>
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={base51Rate}
                  onChange={(e) => handleBaseRateChange(e.target.value)}
                  placeholder="300"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm bg-white focus:border-amber-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Fat Test % */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Fat Test Rating % *
                <span className="block text-[10px] font-normal text-stone-500">
                  (मलाई का टेस्ट %)
                </span>
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={testPercent}
                  onChange={(e) => handleTestChange(e.target.value)}
                  placeholder="53"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm bg-white focus:border-amber-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Weight (kg/किलो) *
                <span className="block text-[10px] font-normal text-stone-500">
                  (कच्ची मलाई का वजन)
                </span>
              </label>
              <div className="relative">
                <Weight className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={weightKg}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="20.000"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-sm bg-white focus:border-amber-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Direct Total Amount input with two-way sync */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Total Amount (कुल राशि) ₹
              <span className="text-[10px] font-normal text-stone-500 ml-1">
                (Type amount to reverse-calculate weight)
              </span>
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="number"
                step="any"
                min="0"
                value={totalAmountInput || Math.round(result.totalAmount).toString()}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-black text-base text-amber-900 bg-amber-50/50 focus:border-amber-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Calculation Breakdown (हिसाब किताब)
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                1% Chheejat (Loss) Deducted
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-stone-500 block font-medium">Net Ghee Yield</span>
                <span className="text-base font-black text-amber-950 font-mono block">
                  {result.gheeYieldPercent}%
                </span>
                <span className="text-[9px] text-stone-400">({numTest}% - 1% loss)</span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-stone-500 block font-medium">Cream Rate/kg</span>
                <span className="text-base font-black text-amber-950 font-mono block">
                  ₹{result.effectiveRatePerKg.toFixed(2)}
                </span>
                <span className="text-[9px] text-stone-400">₹{numBaseRate} × {result.gheeYieldPercent}/50</span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-stone-500 block font-medium">Est. Pure Ghee</span>
                <span className="text-base font-black text-emerald-800 font-mono block">
                  {result.expectedGheeKg.toFixed(3)} kg
                </span>
                <span className="text-[9px] text-stone-400">From {result.weightKg}kg cream</span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-stone-500 block font-medium">Total Price</span>
                <span className="text-base font-black text-rose-800 font-mono block">
                  {formatCurrency(result.totalAmount)}
                </span>
                <span className="text-[9px] text-stone-400">Final bill amount</span>
              </div>
            </div>

            {/* Dairy Industry Unitary Explanation */}
            <div className="bg-white/90 rounded-xl p-3 border border-amber-200/50 text-[11px] text-stone-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Unitary Logic (ऐकिक नियम):</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Standard <strong>51% test</strong> cream gives <strong>50% ghee</strong> (1% loss) @ ₹<strong>{numBaseRate}</strong>/kg cream.
                Therefore, 50 grams ghee = ₹{numBaseRate / 10}.
                <br />
                This sample at <strong>{numTest}% test</strong> produces <strong>{result.gheeYieldPercent} grams ghee</strong> per 100g cream.
                <br />
                Price of {result.gheeYieldPercent}g ghee = ₹{numBaseRate / 10} × ({result.gheeYieldPercent} / 50) = ₹{(numBaseRate * result.gheeYieldPercent / 500).toFixed(2)} / 100g = <strong>₹{result.effectiveRatePerKg.toFixed(2)}/kg</strong>.
              </p>
            </div>
          </div>

          {/* Quick Apply Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {onApplyToSale && (
              <button
                type="button"
                onClick={() => {
                  onApplyToSale({
                    testPercent: result.testPercent,
                    base51Rate: result.base51Rate,
                    weightKg: result.weightKg,
                    effectiveRatePerKg: result.effectiveRatePerKg,
                    totalAmount: result.totalAmount,
                    expectedGheeKg: result.expectedGheeKg,
                  });
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>➕ Apply to Sale Bill (बिक्री बिल बनाएं)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onApplyToPurchase && (
              <button
                type="button"
                onClick={() => {
                  onApplyToPurchase({
                    testPercent: result.testPercent,
                    base51Rate: result.base51Rate,
                    weightKg: result.weightKg,
                    effectiveRatePerKg: result.effectiveRatePerKg,
                    totalAmount: result.totalAmount,
                    expectedGheeKg: result.expectedGheeKg,
                  });
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>📦 Record in Purchases (खरीद में जोड़ें)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
