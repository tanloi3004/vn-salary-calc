
export type Currency = 'VND' | 'USD' | 'JPY';
export type InsuranceBasis = 'official' | 'custom';
export type TaxCalculationMethod = 'progressive' | 'flat10';
export type Region = 1 | 2 | 3 | 4;
export type Nationality = 'VN' | 'Foreign';

export interface SalaryInput {
  salaryInput: number;
  isGrossMode: boolean;
  currency: Currency;
  usdExchangeRate: number; // USD to VND exchange rate
  jpyExchangeRate?: number; // JPY to VND exchange rate
  insuranceBasis: InsuranceBasis;
  insuranceCustom?: number;
  taxCalculationMethod: TaxCalculationMethod;
  region: Region;
  dependents: number;
  nationality: Nationality;
  hasTradeUnionFee?: boolean;
}

export interface ProgressiveTaxDetail {
  bracketLabel: string;
  incomeInBracket: number;
  taxAmountInBracket: number;
  rate: number;
}

export interface SalaryResult {
  gross: number; // In original currency
  net: number; // In original currency
  breakdown: {
    grossSalaryVND: number;
    netSalaryVND: number;
    insurance: {
      baseBHXHBHYT: number;
      baseBHTN: number;
      bhxh: number;
      bhyt: number;
      bhtn: number;
      total: number;
    };
    taxableIncome: number;
    personalIncomeTax: number;
    progressiveTaxDetails?: ProgressiveTaxDetail[];
    totalDeductionsFromGross: number;
    employerContributions: {
      bhxh: number;
      bhyt: number;
      bhtn: number;
      tradeUnionFee: number;
      total: number;
    };
    totalEmployerCost: number;
  };
  currency: Currency;
  originalAmount: number;
  isGrossMode: boolean;
  dependents: number; // Added for display in result
  usdExchangeRateForDisplay: number; // Added for displaying USD equivalent
}

export interface CalculationHistoryEntry {
  id: string;
  timestamp: number;
  mode: 'GrossToNet' | 'NetToGross';
  inputSalary: number;
  inputCurrency: Currency;
  calculatedGrossVND: number;
  calculatedNetVND: number;
  fullInputSnapshot: SalaryInput;
  fullResultSnapshot: SalaryResult;
}

// For i18n keys
export const REGION_OPTION_KEYS: { value: Region; labelKey: string }[] = [
  { value: 1, labelKey: "options.region1" },
  { value: 2, labelKey: "options.region2" },
  { value: 3, labelKey: "options.region3" },
  { value: 4, labelKey: "options.region4" },
];

export const CURRENCY_OPTION_KEYS: { value: Currency; labelKey: string }[] = [
  { value: "VND", labelKey: "options.currencyVND" },
  { value: "USD", labelKey: "options.currencyUSD" },
  { value: "JPY", labelKey: "options.currencyJPY" },
];

export const NATIONALITY_OPTION_KEYS: { value: Nationality; labelKey: string }[] = [
  { value: "VN", labelKey: "options.nationalityVN" },
  { value: "Foreign", labelKey: "options.nationalityForeign" },
];


// Nghị định 147/2024/NĐ-CP (áp dụng từ 1/7/2024)
export const REGION_MINIMUM_WAGE_VND_LEGAL: Record<Region, number> = {
  1: 5220000, // Vùng I
  2: 4650000, // Vùng II
  3: 4080000, // Vùng III
  4: 3650000, // Vùng IV
};

// Nghị định 73/2023/NĐ-CP (áp dụng từ 1/7/2023)
export const BASE_SALARY_VND_LEGAL = 2340000;

export const MAX_INSURANCE_CAP_BASE_SALARY_MULTIPLIER = 20;
export const MAX_INSURANCE_CAP_REGIONAL_WAGE_MULTIPLIER = 20;

export const BHXH_RATE_EMPLOYEE = 0.08;
export const BHYT_RATE_EMPLOYEE = 0.015;
export const BHTN_RATE_EMPLOYEE_VN = 0.01;
export const BHTN_RATE_EMPLOYEE_FOREIGN = 0;

export const BHXH_RATE_EMPLOYER = 0.175;
export const BHYT_RATE_EMPLOYER = 0.03;
export const BHTN_RATE_EMPLOYER_VN = 0.01;
export const BHTN_RATE_EMPLOYER_FOREIGN = 0;
export const TRADE_UNION_FEE_RATE_EMPLOYER = 0.02;

export const PROGRESSIVE_TAX_BRACKETS_VND = [
  { from: 0, to: 5000000, rate: 0.05, label: "Đến 5 triệu" }, // Label might need i18n if shown
  { from: 5000000, to: 10000000, rate: 0.10, label: "Trên 5tr đến 10tr" },
  { from: 10000000, to: 18000000, rate: 0.15, label: "Trên 10tr đến 18tr" },
  { from: 18000000, to: 32000000, rate: 0.20, label: "Trên 18tr đến 32tr" },
  { from: 32000000, to: 52000000, rate: 0.25, label: "Trên 32tr đến 52tr" },
  { from: 52000000, to: 80000000, rate: 0.30, label: "Trên 52tr đến 80tr" },
  { from: 80000000, to: Infinity, rate: 0.35, label: "Trên 80 triệu" },
];

export const PERSONAL_DEDUCTION_VND = 11000000;
export const DEPENDENT_DEDUCTION_VND = 4400000;
export const FOREIGNER_NON_RESIDENT_FLAT_TAX_RATE = 0.20;
