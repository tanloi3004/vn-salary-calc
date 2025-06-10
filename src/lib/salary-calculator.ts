
import type { SalaryInput, SalaryResult, Region } from '@/types/salary';
import { REGION_MINIMUM_WAGE_VND_LEGAL, BASE_SALARY_VND_LEGAL } from '@/types/salary';

// Vietnamese Dong constants
const PERSONAL_DEDUCTION_VND = 11000000;
const DEPENDENT_DEDUCTION_VND = 4400000;

// Using constants from types/salary.ts
const MAX_BHXH_BHTN_CAP_MULTIPLIER = 20; // 20 times base salary
const MAX_BHYT_CAP_MULTIPLIER = 20; // 20 times base salary (aligning with BHXH/BHTN for simplicity)

const BHXH_RATE_EMPLOYEE = 0.08; // 8%
const BHYT_RATE_EMPLOYEE = 0.015; // 1.5%
const BHTN_RATE_EMPLOYEE = 0.01; // 1%

// Progressive tax brackets for Vietnamese & tax-resident foreigners (monthly income)
const PROGRESSIVE_TAX_BRACKETS_VND = [
  { to: 5000000, rate: 0.05 },
  { to: 10000000, rate: 0.10 },
  { to: 18000000, rate: 0.15 },
  { to: 32000000, rate: 0.20 },
  { to: 52000000, rate: 0.25 },
  { to: 80000000, rate: 0.30 },
  { to: Infinity, rate: 0.35 },
];

// For non-resident foreigners, typically a flat 20% on VN-sourced income.
const FOREIGNER_NON_RESIDENT_FLAT_TAX_RATE = 0.20;

function calculateProgressiveTax(taxableIncome: number): number {
  let taxCalculated = 0;
  let remainingTaxableIncome = taxableIncome;
  let previousBracketMax = 0;

  for (const bracket of PROGRESSIVE_TAX_BRACKETS_VND) {
    if (remainingTaxableIncome <= 0) break;
    const incomeInThisBracket = Math.min(remainingTaxableIncome, bracket.to - previousBracketMax);
    taxCalculated += incomeInThisBracket * bracket.rate;
    remainingTaxableIncome -= incomeInThisBracket;
    if (bracket.to === Infinity) break; // Ensure loop terminates for the last bracket
    previousBracketMax = bracket.to;
  }
  return Math.max(0, taxCalculated);
}


function calculateNetFromGross(grossSalaryVND: number, input: SalaryInput): Omit<SalaryResult, 'currency' | 'originalAmount' | 'isGrossMode'> {
  let insuranceBaseVND = grossSalaryVND;
  if (input.insuranceBasis === 'custom' && typeof input.insuranceCustom === 'number') {
    insuranceBaseVND = input.insuranceCustom;
  }

  const minInsuranceBase = REGION_MINIMUM_WAGE_VND_LEGAL[input.region];
  const maxInsuranceCap = MAX_BHXH_BHTN_CAP_MULTIPLIER * BASE_SALARY_VND_LEGAL;

  insuranceBaseVND = Math.max(minInsuranceBase, insuranceBaseVND);
  insuranceBaseVND = Math.min(maxInsuranceCap, insuranceBaseVND);

  const bhxh = insuranceBaseVND * BHXH_RATE_EMPLOYEE;
  const bhyt = insuranceBaseVND * BHYT_RATE_EMPLOYEE;
  const bhtn = insuranceBaseVND * BHTN_RATE_EMPLOYEE;
  const totalInsurance = bhxh + bhyt + bhtn;

  const incomeBeforeTax = grossSalaryVND - totalInsurance;
  const totalPersonalDeductions = PERSONAL_DEDUCTION_VND + (input.dependents * DEPENDENT_DEDUCTION_VND);
  const taxableIncome = Math.max(0, incomeBeforeTax - totalPersonalDeductions);

  let personalIncomeTax = 0;
  if (input.taxCalculationMethod === 'flat10') {
    personalIncomeTax = Math.max(0, incomeBeforeTax * 0.10);
  } else {
    if (input.nationality === 'Foreign') {
      // Assuming tax-resident foreigner using progressive tax for simplicity
      // A more complex app would distinguish resident/non-resident status for foreigners
      personalIncomeTax = calculateProgressiveTax(taxableIncome);
    } else { // Vietnamese
      personalIncomeTax = calculateProgressiveTax(taxableIncome);
    }
  }
  personalIncomeTax = Math.max(0, personalIncomeTax);

  const netSalaryVND = grossSalaryVND - totalInsurance - personalIncomeTax;
  const totalDeductionsFromGross = totalInsurance + personalIncomeTax;

  return {
    gross: grossSalaryVND,
    net: netSalaryVND,
    breakdown: {
      grossSalaryVND,
      netSalaryVND,
      insurance: { base: insuranceBaseVND, bhxh, bhyt, bhtn, total: totalInsurance },
      taxableIncome,
      personalIncomeTax,
      totalDeductionsFromGross,
    },
  };
}


export function computeSalary(input: SalaryInput): SalaryResult {
  let salaryInVND = input.salaryInput;

  if (input.currency !== 'VND' && input.exchangeRate && input.exchangeRate > 0) {
    salaryInVND = input.salaryInput * input.exchangeRate;
  }

  if (input.isGrossMode) {
    const result = calculateNetFromGross(salaryInVND, input);
    return {
      ...result,
      currency: input.currency,
      originalAmount: input.salaryInput,
      isGrossMode: true,
    };
  } else { // Calculate Gross from Net
    const targetNetVND = salaryInVND;
    let estimatedGrossVND = targetNetVND;

    if (targetNetVND > PERSONAL_DEDUCTION_VND) {
        estimatedGrossVND = targetNetVND / (1 - (BHXH_RATE_EMPLOYEE + BHYT_RATE_EMPLOYEE + BHTN_RATE_EMPLOYEE + 0.15));
    } else {
        estimatedGrossVND = targetNetVND / (1 - (BHXH_RATE_EMPLOYEE + BHYT_RATE_EMPLOYEE + BHTN_RATE_EMPLOYEE));
    }
    estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND);

    let iteration = 0;
    const MAX_ITERATIONS = 50;
    const TOLERANCE_VND = 100;

    let lastResult: Omit<SalaryResult, 'currency' | 'originalAmount' | 'isGrossMode'> | null = null;

    for (iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const currentCalc = calculateNetFromGross(estimatedGrossVND, input);
      lastResult = currentCalc;
      const calculatedNetVND = currentCalc.net;

      if (Math.abs(calculatedNetVND - targetNetVND) <= TOLERANCE_VND) {
        break;
      }
      
      const adjustmentFactor = targetNetVND / calculatedNetVND;
      estimatedGrossVND = estimatedGrossVND * adjustmentFactor;

      if (calculatedNetVND === 0 && targetNetVND > 0) {
          estimatedGrossVND = targetNetVND * 2;
      }
      estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND);
    }

    if (!lastResult) {
        lastResult = calculateNetFromGross(estimatedGrossVND, input);
    }

    return {
      ...lastResult,
      net: lastResult.net,
      gross: lastResult.gross,
      currency: input.currency,
      originalAmount: input.salaryInput,
      isGrossMode: false,
    };
  }
}
