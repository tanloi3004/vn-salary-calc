import type { SalaryInput, SalaryResult, Region } from '@/types/salary';

// Vietnamese Dong constants
const PERSONAL_DEDUCTION_VND = 11000000;
const DEPENDENT_DEDUCTION_VND = 4400000;

const REGION_MINIMUM_WAGE_VND: Record<Region, number> = {
  1: 4960000, // Effective from 01/07/2024, previously 4680000
  2: 4410000, // Effective from 01/07/2024, previously 4160000
  3: 3860000, // Effective from 01/07/2024, previously 3640000
  4: 3430000, // Effective from 01/07/2024, previously 3250000
};

const BASE_SALARY_VND = 1800000; // Lương cơ sở, used for max insurance cap
const MAX_BHXH_BHTN_CAP_MULTIPLIER = 20; // 20 times base salary
const MAX_BHYT_CAP_MULTIPLIER = 20; // 20 times minimum regional wage (this can vary by interpretation/company policy)
                                    // Often, companies apply 20 times base salary for BHYT as well for simplicity with BHXH/BHTN.
                                    // Let's use 20 * base_salary for BHYT cap as well for consistency here.

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
  
  // Apply caps to insurance base
  // Minimum is regional minimum wage
  const minInsuranceBase = REGION_MINIMUM_WAGE_VND[input.region];
  // Max for BHXH, BHTN, BHYT is 20 * base salary (lương cơ sở)
  const maxInsuranceCap = MAX_BHXH_BHTN_CAP_MULTIPLIER * BASE_SALARY_VND;

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
    // Flat 10% is usually on gross income for specific contracts (e.g., income < 2M/month or non-labor).
    // For salary, this is a simplification. True "flat 10%" is for non-residents on income < certain thresholds, or specific cases.
    // Assuming it's 10% of (Gross - Insurance) if this method is chosen for simplicity.
    personalIncomeTax = Math.max(0, incomeBeforeTax * 0.10); 
  } else { // Progressive
    if (input.nationality === 'Foreign') {
      // This is a major simplification. Foreigners can be tax residents or non-residents.
      // Tax residents are taxed similarly to Vietnamese (progressive on worldwide income).
      // Non-residents are taxed at a flat 20% on Vietnam-sourced income.
      // Assuming 'Foreign' implies non-resident for this simplified logic when 'progressive' is chosen.
      // Or, if they are tax resident, they use the same progressive scale.
      // Let's assume they are tax resident and use progressive for now.
      // If specific non-resident rules should apply, a separate option or logic would be needed.
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
    let estimatedGrossVND = targetNetVND; // Start with net as a first guess, or targetNet / (1 - estimated_tax_insurance_rate)
    
    // Heuristic: if net is high, gross must be significantly higher.
    if (targetNetVND > PERSONAL_DEDUCTION_VND) {
        estimatedGrossVND = targetNetVND / (1 - (BHXH_RATE_EMPLOYEE + BHYT_RATE_EMPLOYEE + BHTN_RATE_EMPLOYEE + 0.15)); // Avg 15% PIT
    } else {
        estimatedGrossVND = targetNetVND / (1 - (BHXH_RATE_EMPLOYEE + BHYT_RATE_EMPLOYEE + BHTN_RATE_EMPLOYEE));
    }
    estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND);


    let iteration = 0;
    const MAX_ITERATIONS = 50;
    const TOLERANCE_VND = 100; // Stop if calculated net is within 100 VND of target net

    let lastResult: Omit<SalaryResult, 'currency' | 'originalAmount' | 'isGrossMode'> | null = null;

    for (iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const currentCalc = calculateNetFromGross(estimatedGrossVND, input);
      lastResult = currentCalc;
      const calculatedNetVND = currentCalc.net;

      if (Math.abs(calculatedNetVND - targetNetVND) <= TOLERANCE_VND) {
        break; 
      }

      // Adjust estimatedGrossVND
      // This is a simple adjustment. A more sophisticated approach (e.g., Newton's method) could be used.
      // The adjustment factor should aim to correct the error.
      // Gross = Net + PIT(Gross) + Insurance(Gross)
      // If calculatedNet < targetNet, need to increase Gross.
      // If calculatedNet > targetNet, need to decrease Gross.
      // The amount of adjustment is tricky. Let's try a proportional adjustment based on the difference.
      // The effective "tax and insurance rate" can be roughly (Gross - Net) / Gross.
      // Let current_total_deductions = estimatedGrossVND - calculatedNetVND
      // If calculatedNetVND is off by diff = targetNetVND - calculatedNetVND
      // We need to change gross by approx diff / (1 - marginal_tax_and_insurance_rate)
      // For simplicity: estimatedGrossVND = estimatedGrossVND + (targetNetVND - calculatedNetVND)
      // This might oscillate or converge slowly. A better way:
      estimatedGrossVND = estimatedGrossVND * (targetNetVND / calculatedNetVND);
      if (calculatedNetVND === 0 && targetNetVND > 0) { // Avoid division by zero if initial guess is too low
          estimatedGrossVND = targetNetVND * 2; // Double the guess
      }
      estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND); // Gross must be at least Net
    }
    
    if (!lastResult) { // Should not happen if loop runs at least once
        lastResult = calculateNetFromGross(estimatedGrossVND, input);
    }

    return {
      ...lastResult,
      // Ensure the returned net is the target net if converged, or the calculated one.
      // For consistency, always return what calculateNetFromGross produced for the final gross.
      net: lastResult.net, 
      gross: lastResult.gross, // This is the iterated gross
      currency: input.currency,
      originalAmount: input.salaryInput,
      isGrossMode: false,
    };
  }
}
