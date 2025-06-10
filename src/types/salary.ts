export type Currency = 'VND' | 'USD' | 'JPY';
export type InsuranceBasis = 'official' | 'custom';
export type TaxCalculationMethod = 'progressive' | 'flat10';
export type Region = 1 | 2 | 3 | 4;
export type Nationality = 'VN' | 'Foreign';

export interface SalaryInput {
  salaryInput: number;
  isGrossMode: boolean;
  currency: Currency;
  exchangeRate?: number;
  insuranceBasis: InsuranceBasis;
  insuranceCustom?: number;
  taxCalculationMethod: TaxCalculationMethod;
  region: Region;
  dependents: number;
  nationality: Nationality;
}

export interface SalaryResult {
  gross: number;
  net: number;
  breakdown: {
    grossSalaryVND: number;
    netSalaryVND: number;
    insurance: { 
      base: number;
      bhxh: number; 
      bhyt: number; 
      bhtn: number;
      total: number;
    };
    taxableIncome: number;
    personalIncomeTax: number;
    totalDeductionsFromGross: number; // Insurance + PIT
  };
  currency: Currency; // To display result in original currency if needed
  originalAmount: number; // Original input amount
  isGrossMode: boolean; // Mode used for this calculation
}

export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: 1, label: "Vùng 1" },
  { value: 2, label: "Vùng 2" },
  { value: 3, label: "Vùng 3" },
  { value: 4, label: "Vùng 4" },
];

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "VND", label: "VND" },
  { value: "USD", label: "USD" },
  { value: "JPY", label: "JPY" },
];

export const NATIONALITY_OPTIONS: { value: Nationality; label: string }[] = [
  { value: "VN", label: "Việt Nam" },
  { value: "Foreign", label: "Người nước ngoài" },
];
