
import type { SalaryInput, SalaryResult, Region, ProgressiveTaxDetail } from '@/types/salary';
import {
  REGION_MINIMUM_WAGE_VND_LEGAL,
  BASE_SALARY_VND_LEGAL,
  MAX_INSURANCE_CAP_BASE_SALARY_MULTIPLIER,
  MAX_INSURANCE_CAP_REGIONAL_WAGE_MULTIPLIER,
  BHXH_RATE_EMPLOYEE,
  BHYT_RATE_EMPLOYEE,
  BHTN_RATE_EMPLOYEE_VN,
  BHTN_RATE_EMPLOYEE_FOREIGN,
  BHXH_RATE_EMPLOYER,
  BHYT_RATE_EMPLOYER,
  BHTN_RATE_EMPLOYER_VN,
  BHTN_RATE_EMPLOYER_FOREIGN,
  TRADE_UNION_FEE_RATE_EMPLOYER,
  PROGRESSIVE_TAX_BRACKETS_VND,
  PERSONAL_DEDUCTION_VND,
  DEPENDENT_DEDUCTION_VND
} from '@/types/salary';


function calculateProgressiveTax(taxableIncome: number): { totalTax: number; taxDetails: ProgressiveTaxDetail[] } {
  let totalTaxCalculated = 0;
  const details: ProgressiveTaxDetail[] = [];

  if (taxableIncome <= 0) {
    return {
      totalTax: 0,
      taxDetails: PROGRESSIVE_TAX_BRACKETS_VND.map(b => ({
        bracketLabel: b.label,
        incomeInBracket: 0,
        taxAmountInBracket: 0,
        rate: b.rate,
      }))
    };
  }

  let remainingTaxableIncomeForProcessing = taxableIncome;

  for (const bracket of PROGRESSIVE_TAX_BRACKETS_VND) {
    const incomeInThisBracketLevel = Math.min(
      remainingTaxableIncomeForProcessing,
      bracket.to - bracket.from
    );
    
    let actualIncomeTaxedInBracket = 0;
    if(taxableIncome > bracket.from) {
      actualIncomeTaxedInBracket = Math.min(taxableIncome - bracket.from, bracket.to - bracket.from);
      actualIncomeTaxedInBracket = Math.min(actualIncomeTaxedInBracket, remainingTaxableIncomeForProcessing);
    }


    if (actualIncomeTaxedInBracket < 0) actualIncomeTaxedInBracket = 0;


    const taxForThisBracket = actualIncomeTaxedInBracket * bracket.rate;
    totalTaxCalculated += taxForThisBracket;

    details.push({
      bracketLabel: bracket.label,
      incomeInBracket: actualIncomeTaxedInBracket,
      taxAmountInBracket: taxForThisBracket,
      rate: bracket.rate,
    });

    remainingTaxableIncomeForProcessing -= actualIncomeTaxedInBracket;
    if (remainingTaxableIncomeForProcessing <= 0 && taxableIncome > 0) {
         const currentBracketIndex = PROGRESSIVE_TAX_BRACKETS_VND.indexOf(bracket);
         for (let i = currentBracketIndex + 1; i < PROGRESSIVE_TAX_BRACKETS_VND.length; i++) {
            const futureBracket = PROGRESSIVE_TAX_BRACKETS_VND[i];
            details.push({
                bracketLabel: futureBracket.label,
                incomeInBracket: 0,
                taxAmountInBracket: 0,
                rate: futureBracket.rate,
            });
         }
      break;
    }
  }
  
  return { totalTax: Math.max(0, totalTaxCalculated), taxDetails: details };
}


function calculateNetFromGross(grossSalaryVND: number, input: SalaryInput): Omit<SalaryResult, 'currency' | 'originalAmount' | 'isGrossMode' | 'dependents' | 'usdExchangeRateForDisplay'> {
  const minInsuranceFloor = REGION_MINIMUM_WAGE_VND_LEGAL[input.region];

  // Determine initial insurance base before capping
  let initialInsuranceBase = grossSalaryVND;
  if (input.insuranceBasis === 'custom' && typeof input.insuranceCustom === 'number' && input.insuranceCustom > 0) {
    initialInsuranceBase = input.insuranceCustom;
  }
  initialInsuranceBase = Math.max(minInsuranceFloor, initialInsuranceBase);


  // Cap for BHXH, BHYT
  const maxCapBHXHBHYT = MAX_INSURANCE_CAP_BASE_SALARY_MULTIPLIER * BASE_SALARY_VND_LEGAL;
  const insuranceBaseBHXHBHYT = Math.min(initialInsuranceBase, maxCapBHXHBHYT);

  // Cap for BHTN
  const maxCapBHTN = MAX_INSURANCE_CAP_REGIONAL_WAGE_MULTIPLIER * REGION_MINIMUM_WAGE_VND_LEGAL[input.region];
  const insuranceBaseBHTN = Math.min(initialInsuranceBase, maxCapBHTN);

  // Employee insurance contributions
  const bhxhEmployee = insuranceBaseBHXHBHYT * BHXH_RATE_EMPLOYEE;
  const bhytEmployee = insuranceBaseBHXHBHYT * BHYT_RATE_EMPLOYEE;
  const bhtnRateEmployee = input.nationality === 'VN' ? BHTN_RATE_EMPLOYEE_VN : BHTN_RATE_EMPLOYEE_FOREIGN;
  const bhtnEmployee = insuranceBaseBHTN * bhtnRateEmployee;
  const totalEmployeeInsurance = bhxhEmployee + bhytEmployee + bhtnEmployee;

  // Income before tax and taxable income for PIT
  const incomeBeforeTax = grossSalaryVND - totalEmployeeInsurance;
  const totalPersonalDeductions = PERSONAL_DEDUCTION_VND + (input.dependents * DEPENDENT_DEDUCTION_VND);
  
  let personalIncomeTax = 0;
  let progressiveTaxDetails: ProgressiveTaxDetail[] | undefined = undefined;

  if (input.taxCalculationMethod === 'flat10') {
    personalIncomeTax = Math.max(0, incomeBeforeTax * 0.10);
  } else { // progressive
    const taxableIncomeForPIT = Math.max(0, incomeBeforeTax - totalPersonalDeductions);
    const taxCalcResult = calculateProgressiveTax(taxableIncomeForPIT);
    personalIncomeTax = taxCalcResult.totalTax;
    progressiveTaxDetails = taxCalcResult.taxDetails;
  }
  personalIncomeTax = Math.max(0, personalIncomeTax);

  const netSalaryVND = grossSalaryVND - totalEmployeeInsurance - personalIncomeTax;
  const totalDeductionsFromGross = totalEmployeeInsurance + personalIncomeTax;

  // Employer insurance contributions
  const bhxhEmployer = insuranceBaseBHXHBHYT * BHXH_RATE_EMPLOYER;
  const bhytEmployer = insuranceBaseBHXHBHYT * BHYT_RATE_EMPLOYER;
  const bhtnRateEmployer = input.nationality === 'VN' ? BHTN_RATE_EMPLOYER_VN : BHTN_RATE_EMPLOYER_FOREIGN;
  const bhtnEmployer = insuranceBaseBHTN * bhtnRateEmployer;
  
  // Trade Union Fee (Employer)
  let tradeUnionFeeAmount = 0;
  if (input.hasTradeUnionFee) {
    const tradeUnionFeeBase = Math.min(grossSalaryVND, maxCapBHXHBHYT); // Cap is 20 * base salary
    tradeUnionFeeAmount = tradeUnionFeeBase * TRADE_UNION_FEE_RATE_EMPLOYER;
  }

  const totalEmployerInsuranceAndFees = bhxhEmployer + bhytEmployer + bhtnEmployer + tradeUnionFeeAmount;
  const totalEmployerCost = grossSalaryVND + totalEmployerInsuranceAndFees;
  
  // These are VND values; conversion to original currency happens in computeSalary
  return {
    gross: grossSalaryVND, 
    net: netSalaryVND,
    breakdown: {
      grossSalaryVND,
      netSalaryVND,
      insurance: {
        baseBHXHBHYT: insuranceBaseBHXHBHYT,
        baseBHTN: insuranceBaseBHTN,
        bhxh: bhxhEmployee,
        bhyt: bhytEmployee,
        bhtn: bhtnEmployee,
        total: totalEmployeeInsurance
      },
      taxableIncome: (input.taxCalculationMethod === 'progressive' ? Math.max(0, incomeBeforeTax - totalPersonalDeductions) : Math.max(0, incomeBeforeTax)),
      personalIncomeTax,
      progressiveTaxDetails,
      totalDeductionsFromGross,
      employerContributions: {
        bhxh: bhxhEmployer,
        bhyt: bhytEmployer,
        bhtn: bhtnEmployer,
        tradeUnionFee: tradeUnionFeeAmount,
        total: totalEmployerInsuranceAndFees,
      },
      totalEmployerCost,
    },
  };
}


export function computeSalary(input: SalaryInput): SalaryResult {
  let salaryInVND = input.salaryInput;
  let relevantExchangeRate = 1;

  if (input.currency === 'USD' && input.usdExchangeRate > 0) {
    salaryInVND = input.salaryInput * input.usdExchangeRate;
    relevantExchangeRate = input.usdExchangeRate;
  } else if (input.currency === 'JPY' && input.jpyExchangeRate && input.jpyExchangeRate > 0) {
    salaryInVND = input.salaryInput * input.jpyExchangeRate;
    relevantExchangeRate = input.jpyExchangeRate;
  }


  if (input.isGrossMode) {
    const resultFromGross = calculateNetFromGross(salaryInVND, input);
     return {
      gross: input.currency === 'VND' ? resultFromGross.breakdown.grossSalaryVND : input.salaryInput,
      net: input.currency === 'VND' ? resultFromGross.breakdown.netSalaryVND : resultFromGross.breakdown.netSalaryVND / relevantExchangeRate,
      breakdown: resultFromGross.breakdown,
      currency: input.currency,
      originalAmount: input.salaryInput,
      isGrossMode: true,
      dependents: input.dependents,
      usdExchangeRateForDisplay: input.usdExchangeRate,
    };
  } else { 
    const targetNetVND = salaryInVND;
    
    let estimatedGrossVND = targetNetVND;
    const totalBasicInsuranceRate = BHXH_RATE_EMPLOYEE + BHYT_RATE_EMPLOYEE + (input.nationality === 'VN' ? BHTN_RATE_EMPLOYEE_VN : BHTN_RATE_EMPLOYEE_FOREIGN);
    
    if (targetNetVND > PERSONAL_DEDUCTION_VND) { 
        estimatedGrossVND = targetNetVND / (1 - totalBasicInsuranceRate - 0.15); 
    } else {
        estimatedGrossVND = targetNetVND / (1 - totalBasicInsuranceRate);
    }
    estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND); 


    let iteration = 0;
    const MAX_ITERATIONS = 100; 
    const TOLERANCE_VND = 1; 

    let lastResultBreakdown: SalaryResult['breakdown'] | null = null;

    for (iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const currentCalc = calculateNetFromGross(estimatedGrossVND, input);
      lastResultBreakdown = currentCalc.breakdown;
      const calculatedNetVND = currentCalc.breakdown.netSalaryVND;

      if (Math.abs(calculatedNetVND - targetNetVND) <= TOLERANCE_VND) {
        break;
      }
      
      if (calculatedNetVND <= 0 && targetNetVND > 0) {
          estimatedGrossVND = estimatedGrossVND * 1.5 + targetNetVND; 
      } else if (calculatedNetVND > 0) {
          estimatedGrossVND = estimatedGrossVND * (targetNetVND / calculatedNetVND);
      } else { 
          estimatedGrossVND += TOLERANCE_VND; 
      }
      estimatedGrossVND = Math.max(targetNetVND, estimatedGrossVND); 
    }

    if (!lastResultBreakdown) { 
        lastResultBreakdown = calculateNetFromGross(estimatedGrossVND, input).breakdown;
    }
    
    return {
      gross: input.currency === 'VND' ? lastResultBreakdown.grossSalaryVND : lastResultBreakdown.grossSalaryVND / relevantExchangeRate,
      net: input.currency === 'VND' ? lastResultBreakdown.netSalaryVND : input.salaryInput,
      breakdown: lastResultBreakdown,
      currency: input.currency,
      originalAmount: input.salaryInput,
      isGrossMode: false,
      dependents: input.dependents,
      usdExchangeRateForDisplay: input.usdExchangeRate,
    };
  }
}
