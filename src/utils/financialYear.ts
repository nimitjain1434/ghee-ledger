import { FinancialYear } from '../types';

export const FINANCIAL_YEARS: { id: FinancialYear; label: string; startYear: number; endYear: number }[] = [
  { id: '2026-27', label: 'FY 2026-27 (Current)', startYear: 2026, endYear: 2027 },
  { id: '2025-26', label: 'FY 2025-26 (Previous)', startYear: 2025, endYear: 2026 },
  { id: '2024-25', label: 'FY 2024-25 (Prev to Prev)', startYear: 2024, endYear: 2025 },
];

export function getFinancialYearFromDate(dateStr: string): FinancialYear {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed

  // In India, April (month 4) starts the new FY
  if (month >= 4) {
    const end = (year + 1) % 100;
    const fyId = `${year}-${String(end).padStart(2, '0')}` as FinancialYear;
    return fyId;
  } else {
    const start = year - 1;
    const end = year % 100;
    const fyId = `${start}-${String(end).padStart(2, '0')}` as FinancialYear;
    return fyId;
  }
}

export function getFinancialYearDateRange(fy: FinancialYear): { startDate: string; endDate: string } {
  const [startStr, endSuffix] = fy.split('-');
  const startYear = parseInt(startStr, 10);
  const endYear = startYear + 1;
  return {
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
  };
}

export interface MonthInfo {
  key: string; // "YYYY-MM"
  label: string; // "August 2026"
  shortLabel: string; // "Aug 2026"
  year: number;
  monthIndex: number; // 0-11
  daysInMonth: number;
}

export function getMonthsInFinancialYear(fy: FinancialYear): MonthInfo[] {
  const [startStr] = fy.split('-');
  const startYear = parseInt(startStr, 10);
  const endYear = startYear + 1;

  const months: MonthInfo[] = [];

  // April (3) to December (11) of startYear
  for (let m = 3; m <= 11; m++) {
    const d = new Date(startYear, m, 1);
    const key = `${startYear}-${String(m + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(startYear, m + 1, 0).getDate();
    months.push({
      key,
      label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      shortLabel: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      year: startYear,
      monthIndex: m,
      daysInMonth,
    });
  }

  // January (0) to March (2) of endYear
  for (let m = 0; m <= 2; m++) {
    const d = new Date(endYear, m, 1);
    const key = `${endYear}-${String(m + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(endYear, m + 1, 0).getDate();
    months.push({
      key,
      label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      shortLabel: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      year: endYear,
      monthIndex: m,
      daysInMonth,
    });
  }

  return months;
}

export function getDaysInMonthString(monthKey: string): string[] {
  // monthKey: "YYYY-MM"
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const count = new Date(year, month, 0).getDate();

  const days: string[] = [];
  for (let d = 1; d <= count; d++) {
    days.push(`${yearStr}-${String(monthStr).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return days;
}
