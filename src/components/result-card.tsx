
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, FileText, CircleDollarSign, Shield, Percent, PieChart as PieChartIcon, Briefcase, ListChecks, FileSpreadsheet, Printer, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SalaryResult } from "@/types/salary";
import { useState, useEffect, useRef } from "react";

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie as RechartsPie, Cell, Tooltip as RechartsTooltip } from "recharts";

interface ResultCardProps {
  result: SalaryResult | null;
  locale: string;
  messages: any; // Type for resultCard messages
}

// Helper to get nested values from messages object
const getMsg = (messages: any, key: string, defaultText = '') => {
  const keys = key.split('.');
  let result = messages;
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) return defaultText || key;
  }
  return result;
};

const formatCurrency = (value: number | undefined, currency: string = "VND", localeForFormatting: string = "vi-VN") => {
  if (value === undefined || isNaN(value)) value = 0;
  const effectiveLocale = currency === "VND" ? "vi-VN" : (localeForFormatting === "vi" ? "vi-VN" : "en-US");

  if (currency === "VND") {
    try {
      return new Intl.NumberFormat(effectiveLocale, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return value.toLocaleString(effectiveLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
  } else { // For USD, JPY
    try {
      return new Intl.NumberFormat(effectiveLocale, {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol', // Use symbol for USD, JPY
        minimumFractionDigits: (currency === "JPY" ? 0 : 2), // JPY usually has 0 decimals
        maximumFractionDigits: (currency === "JPY" ? 0 : 2),
      }).format(value);
    } catch (e) {
      const numericPart = new Intl.NumberFormat(effectiveLocale, { style: 'decimal', minimumFractionDigits: (currency === "JPY" ? 0 : 2), maximumFractionDigits: (currency === "JPY" ? 0 : 2) }).format(value);
      return `${numericPart} ${currency}`;
    }
  }
};

const formatCurrencyForClipboard = (value: number, currency: string, localeForFormatting: string = "vi-VN") => {
    if (isNaN(value)) value = 0;
    const effectiveLocale = localeForFormatting === "vi" ? "vi-VN" : "en-US";
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'code', // Use currency code for clipboard
        minimumFractionDigits: (currency === "JPY" ? 0 : 2),
        maximumFractionDigits: (currency === "JPY" ? 0 : 2),
    };
    try {
      return new Intl.NumberFormat(effectiveLocale, options).format(value);
    } catch {
       return `${value.toFixed((currency === "JPY" ? 0 : 2))} ${currency}`;
    }
}

const formatNumberForExport = (value: number | undefined): number => {
  if (value === undefined || isNaN(value)) return 0;
  return Number(value.toFixed(0)); // Keep as 0 decimal for VND, but general for other currencies if used
};


export default function ResultCard({ result, locale, messages }: ResultCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyToClipboard = () => {
    if (!result) return;

    const { gross, net, breakdown, isGrossMode, originalAmount, currency, dependents, usdExchangeRateForDisplay } = result;
    const inputType = isGrossMode ? "Gross" : "Net";
    const outputType = isGrossMode ? "Net" : "Gross";
    const finalOutputAmount = isGrossMode ? net : gross;
    
    let textToCopy = `
VN Salary Calculation Result:
---------------------------------
Input Salary (${inputType} ${currency}): ${formatCurrencyForClipboard(originalAmount, currency, locale)}
Number of Dependents: ${dependents}
Calculated ${outputType} (${currency}): ${formatCurrencyForClipboard(finalOutputAmount, currency, locale)}
`;
    if (currency === 'VND' && usdExchangeRateForDisplay > 0) {
      textToCopy += `USD Equivalent: ${formatCurrencyForClipboard( (isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND) / usdExchangeRateForDisplay, 'USD', locale)}\n`;
    } else if (currency === 'JPY' && usdExchangeRateForDisplay > 0) {
      textToCopy += `USD Equivalent: ${formatCurrencyForClipboard( (isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND) / usdExchangeRateForDisplay, 'USD', locale)}\n`;
    }
    if (currency !== 'VND') {
        textToCopy += `VND Equivalent: ${formatCurrencyForClipboard(isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND, 'VND', locale)}\n`;
    }

textToCopy += `---------------------------------
Details (all amounts in VND unless specified):
Gross Salary (VND): ${formatCurrency(breakdown.grossSalaryVND, "VND", locale)}
Net Salary (VND): ${formatCurrency(breakdown.netSalaryVND, "VND", locale)}

Employee's Insurance Contributions (VND):
  - Base for SI, HI: ${formatCurrency(breakdown.insurance.baseBHXHBHYT, "VND", locale)}
  - Base for UI: ${formatCurrency(breakdown.insurance.baseBHTN, "VND", locale)}
  - SI (8%): ${formatCurrency(breakdown.insurance.bhxh, "VND", locale)}
  - HI (1.5%): ${formatCurrency(breakdown.insurance.bhyt, "VND", locale)}
  - UI: ${formatCurrency(breakdown.insurance.bhtn, "VND", locale)}
  - Total Employee Insurance: ${formatCurrency(breakdown.insurance.total, "VND", locale)}

Personal Income Tax (PIT) (VND):
  - Taxable Income: ${formatCurrency(breakdown.taxableIncome, "VND", locale)}
  - PIT Amount: ${formatCurrency(breakdown.personalIncomeTax, "VND", locale)}
`;

    if (breakdown.progressiveTaxDetails && breakdown.progressiveTaxDetails.length > 0) {
      textToCopy += "\n  PIT Breakdown by Brackets (VND):\n";
      breakdown.progressiveTaxDetails.forEach(detail => {
        textToCopy += `    - ${detail.bracketLabel}: Income ${formatCurrency(detail.incomeInBracket, "VND", locale)}, Tax ${formatCurrency(detail.taxAmountInBracket, "VND", locale)} (${(detail.rate * 100).toFixed(0)}%)\n`;
      });
    }

textToCopy += `
Total Deductions from Gross (Insurance + PIT): ${formatCurrency(breakdown.totalDeductionsFromGross, "VND", locale)}
---------------------------------
Employer's Contributions (VND):
  - SI (17.5%): ${formatCurrency(breakdown.employerContributions.bhxh, "VND", locale)}
  - HI (3%): ${formatCurrency(breakdown.employerContributions.bhyt, "VND", locale)}
  - UI: ${formatCurrency(breakdown.employerContributions.bhtn, "VND", locale)}`;
    if (breakdown.employerContributions.tradeUnionFee > 0) {
      textToCopy += `
  - Trade Union Fee (2%): ${formatCurrency(breakdown.employerContributions.tradeUnionFee, "VND", locale)}`;
    }
    textToCopy += `
  - Total Employer Contributions: ${formatCurrency(breakdown.employerContributions.total, "VND", locale)}

Total Employer Cost (Gross Salary + Employer Contributions) (VND): ${formatCurrency(breakdown.totalEmployerCost, "VND", locale)}
---------------------------------
Calculation based on provided inputs.
    `;
    navigator.clipboard.writeText(textToCopy.trim())
      .then(() => {
        setCopied(true);
        toast({
          title: messages.copySuccessToast,
          description: messages.copySuccessDescription,
          action: <CheckCircle className="text-green-500" />,
        });
      })
      .catch(err => {
        toast({
          variant: "destructive",
          title: messages.copyErrorToast,
          description: messages.copyErrorDescription,
          action: <AlertTriangle className="text-red-500" />,
        });
      });
  };

  const handleExportToExcel = () => {
    if (!result) return;
    const { gross, net, breakdown, isGrossMode, originalAmount, currency, dependents, usdExchangeRateForDisplay } = result;
    const finalOutputAmount = isGrossMode ? net : gross;

    const dataToExport: (string | number | undefined)[][] = [
      ["VN SALARY CALCULATION RESULT"], // This header can be translated if needed
      [],
      ["Calculation Mode:", isGrossMode ? "Gross to Net" : "Net to Gross"],
      [`Input Salary (${currency}):`, originalAmount],
      ["Number of Dependents:", dependents],
      [`Calculated ${isGrossMode ? "Net" : "Gross"} (${currency}):`, finalOutputAmount],
    ];

    if (currency === 'VND' && usdExchangeRateForDisplay > 0) {
      dataToExport.push([`USD Equivalent:`, (isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND) / usdExchangeRateForDisplay]);
    } else if (currency === 'JPY' && usdExchangeRateForDisplay > 0) {
       dataToExport.push([`USD Equivalent:`, (isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND) / usdExchangeRateForDisplay]);
    }
    if (currency !== 'VND') {
        dataToExport.push([`VND Equivalent:`, isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND]);
    }


    dataToExport.push(
      [],
      ["DETAILS (VND)"],
      ["Gross Salary (VND):", formatNumberForExport(breakdown.grossSalaryVND)],
      ["Net Salary (VND):", formatNumberForExport(breakdown.netSalaryVND)],
      [],
      ["EMPLOYEE'S INSURANCE CONTRIBUTIONS (VND)"],
      ["Base for SI, HI:", formatNumberForExport(breakdown.insurance.baseBHXHBHYT)],
      ["Base for UI:", formatNumberForExport(breakdown.insurance.baseBHTN)],
      ["SI (8%):", formatNumberForExport(breakdown.insurance.bhxh)],
      ["HI (1.5%):", formatNumberForExport(breakdown.insurance.bhyt)],
      ["UI:", formatNumberForExport(breakdown.insurance.bhtn)],
      ["Total Employee Insurance:", formatNumberForExport(breakdown.insurance.total)],
      [],
      ["PERSONAL INCOME TAX (PIT) (VND)"],
      ["Taxable Income:", formatNumberForExport(breakdown.taxableIncome)],
      ["PIT Amount:", formatNumberForExport(breakdown.personalIncomeTax)]
    );

    if (breakdown.progressiveTaxDetails && breakdown.progressiveTaxDetails.length > 0 && breakdown.personalIncomeTax > 0) {
      dataToExport.push(["PIT Breakdown by Brackets (VND):"]);
      dataToExport.push(["Bracket", "Taxable Income in Bracket", "Tax Rate", "Tax Amount in Bracket"]);
      breakdown.progressiveTaxDetails.forEach(detail => {
        if (detail.incomeInBracket > 0 || (breakdown.personalIncomeTax === 0 && breakdown.progressiveTaxDetails && breakdown.progressiveTaxDetails.indexOf(detail) === 0) ) {
           dataToExport.push([
            detail.bracketLabel, 
            formatNumberForExport(detail.incomeInBracket),
            `${(detail.rate * 100).toFixed(0)}%`,
            formatNumberForExport(detail.taxAmountInBracket),
          ]);
        }
      });
    }
     dataToExport.push([]);
     dataToExport.push(["Total Deductions from Gross (Insurance + PIT):", formatNumberForExport(breakdown.totalDeductionsFromGross)]);
     dataToExport.push([]);
     dataToExport.push(["EMPLOYER'S CONTRIBUTIONS (VND)"]);
     dataToExport.push(["SI (17.5%):", formatNumberForExport(breakdown.employerContributions.bhxh)]);
     dataToExport.push(["HI (3%):", formatNumberForExport(breakdown.employerContributions.bhyt)]);
     dataToExport.push(["UI:", formatNumberForExport(breakdown.employerContributions.bhtn)]);
     if (breakdown.employerContributions.tradeUnionFee > 0) {
      dataToExport.push(["Trade Union Fee (2%):", formatNumberForExport(breakdown.employerContributions.tradeUnionFee)]);
     }
     dataToExport.push(["Total Employer Contributions:", formatNumberForExport(breakdown.employerContributions.total)]);
     dataToExport.push([]);
     dataToExport.push(["Total Employer Cost:", formatNumberForExport(breakdown.totalEmployerCost)]);

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Calculation");
    
    const colWidths = [{ wch: 40 }, { wch: 20 }]; 
    worksheet['!cols'] = colWidths;

    try {
      XLSX.writeFile(workbook, `VN_Salary_Calc_${isGrossMode ? 'GtoN' : 'NtoG'}.xlsx`);
      toast({
        title: messages.exportExcelSuccessToast,
        description: messages.exportExcelSuccessDescription,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: messages.exportExcelErrorToast,
        description: messages.exportExcelErrorDescription,
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleExportToPDF = async () => {
    if (!result || !printableRef.current) {
      toast({
        variant: "destructive",
        title: messages.exportPDFErrorToast,
        description: messages.exportPDFErrorDescription,
        action: <AlertTriangle className="text-red-500" />,
      });
      return;
    }

    const { isGrossMode } = result;
    
    try {
      const originalOverflow = printableRef.current.style.overflow;
      printableRef.current.style.overflow = 'visible';

      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      printableRef.current.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4' 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      if (scaledHeight > pdfHeight) {
        let position = 0;
        const pageImgHeight = pdfHeight;

        while(position < imgHeight) {
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = imgWidth;
            sliceCanvas.height = Math.min(imgHeight - position, pageImgHeight / ratio);
            const sliceCtx = sliceCanvas.getContext('2d');
            sliceCtx?.drawImage(canvas, 0, position, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height);
            
            const sliceImgData = sliceCanvas.toDataURL('image/png');
            const sliceScaledHeight = sliceCanvas.height * ratio;
            const sliceScaledWidth = sliceCanvas.width * ratio;
            const sliceX = (pdfWidth - sliceScaledWidth) / 2;

            if (position > 0) {
                pdf.addPage();
            }
            pdf.addImage(sliceImgData, 'PNG', sliceX, 0, sliceScaledWidth, sliceScaledHeight);
            position += sliceCanvas.height;
        }
      } else {
         pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      }

      pdf.save(`VN_Salary_Calc_${isGrossMode ? 'GtoN' : 'NtoG'}.pdf`);

      toast({
        title: messages.exportPDFSuccessToast,
        description: messages.exportPDFSuccessDescription,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast({
        variant: "destructive",
        title: messages.exportPDFErrorToast,
        description: messages.exportPDFErrorGeneric.replace("{error}", errorMsg),
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };


  if (!result) {
    return (
      <Card className="w-full mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <FileText className="mr-2" /> {messages.title}
          </CardTitle>
          <CardDescription>{messages.prompt}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">{messages.noResult}</p>
        </CardContent>
      </Card>
    );
  }

  const { gross, net, breakdown, isGrossMode, currency, originalAmount, dependents, usdExchangeRateForDisplay } = result;
  const displayInputType = isGrossMode ? messages.grossInputLabel : messages.netInputLabel;
  const displayOutputType = isGrossMode ? messages.netOutputLabel : messages.grossOutputLabel;
  const displayOutputValue = isGrossMode ? net : gross;

  const chartData = breakdown.grossSalaryVND > 0 ? [
    { name: messages.insuranceBHXH, value: breakdown.insurance.bhxh, fill: "hsl(var(--chart-1))" },
    { name: messages.insuranceBHYT, value: breakdown.insurance.bhyt, fill: "hsl(var(--chart-2))" },
    { name: messages.insuranceBHTN, value: breakdown.insurance.bhtn, fill: "hsl(var(--chart-3))" },
    { name: messages.pitAmount, value: breakdown.personalIncomeTax, fill: "hsl(var(--chart-4))" },
    { name: messages.netSalary, value: breakdown.netSalaryVND, fill: "hsl(var(--chart-5))" },
  ].filter(item => item.value > 0) : [];

  const chartConfig = {
    [messages.insuranceBHXH]: { label: messages.insuranceBHXH, color: "hsl(var(--chart-1))" },
    [messages.insuranceBHYT]: { label: messages.insuranceBHYT, color: "hsl(var(--chart-2))" },
    [messages.insuranceBHTN]: { label: messages.insuranceBHTN, color: "hsl(var(--chart-3))" },
    [messages.pitAmount]: { label: messages.pitAmount, color: "hsl(var(--chart-4))" },
    [messages.netSalary]: { label: messages.netSalary, color: "hsl(var(--chart-5))" },
  } satisfies ChartConfig;


  return (
    <Card className="w-full mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center">
          {isGrossMode ? <TrendingDown className="mr-2 text-red-500" /> : <TrendingUp className="mr-2 text-green-500" />}
          {isGrossMode ? messages.resultTitleNet : messages.resultTitleGross}
        </CardTitle>
        <CardDescription>
          {messages.fromInputSalary.replace("{type}", displayInputType)} {formatCurrency(originalAmount, currency, locale)} {currency !== "VND" ? currency : ""}
          <br />
          {messages.dependentsLabelResult.replace("{count}", String(dependents))}
        </CardDescription>
      </CardHeader>
      <div ref={printableRef}>
        <CardContent className="space-y-6">
          <div className="text-center py-6 bg-accent/20 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">
              {displayOutputType} {currency !== "VND" ? `(${currency})` : ""}
            </p>
            <p className="text-4xl font-bold text-primary mt-1">
              {formatCurrency(displayOutputValue, currency, locale)}
            </p>
            {currency !== "VND" && (
              <p className="text-xs text-muted-foreground mt-1">
                 {messages.equivalentToVND.replace("{amount}", formatCurrency(isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND, "VND", locale))}
              </p>
            )}
            {(currency === 'VND' || currency === 'JPY') && usdExchangeRateForDisplay > 0 && (
                 <p className="text-xs text-muted-foreground mt-1">
                    {messages.equivalentToUSD.replace("{amount}", formatCurrency( (isGrossMode ? breakdown.netSalaryVND : breakdown.grossSalaryVND) / usdExchangeRateForDisplay, "USD", locale))}
                </p>
            )}
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><CircleDollarSign size={20} className="mr-2 text-primary" />{messages.detailsVND}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/50">
                <span className="font-medium text-muted-foreground">{messages.grossSalary}</span>
                <span className="font-semibold text-foreground">{formatCurrency(breakdown.grossSalaryVND, "VND", locale)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/50">
                <span className="font-medium text-muted-foreground">{messages.netSalary}</span>
                <span className="font-semibold text-foreground">{formatCurrency(breakdown.netSalaryVND, "VND", locale)}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
              <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Shield size={18} className="mr-2 text-primary" />{messages.employeeInsuranceTitle}</h4>
              <div className="space-y-1 pl-4 text-sm">
                <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">{messages.insuranceBaseBHXHBHYT}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.baseBHXHBHYT, "VND", locale)}</span>
                </div>
                <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">{messages.insuranceBaseBHTN}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.baseBHTN, "VND", locale)}</span>
                </div>
                <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">{messages.insuranceBHXH}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.bhxh, "VND", locale)}</span>
                </div>
                <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">{messages.insuranceBHYT}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.bhyt, "VND", locale)}</span>
                </div>
                <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">{messages.insuranceBHTN}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.bhtn, "VND", locale)}</span>
                </div>
                <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                    <span className="text-muted-foreground">{messages.totalEmployeeInsurance}</span>
                    <span className="text-foreground">{formatCurrency(breakdown.insurance.total, "VND", locale)}</span>
                </div>
              </div>
          </div>

          <Separator />
          
          <div>
              <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Percent size={18} className="mr-2 text-primary" />{messages.pitTitle}</h4>
              <div className="space-y-1 pl-4 text-sm">
                  <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                      <span className="text-muted-foreground">{messages.taxableIncome}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.taxableIncome, "VND", locale)}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                      <span className="text-muted-foreground">{messages.pitAmount}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.personalIncomeTax, "VND", locale)}</span>
                  </div>
              </div>
          </div>
          {breakdown.progressiveTaxDetails && breakdown.progressiveTaxDetails.length > 0 && breakdown.personalIncomeTax > 0 && (
            <>
              <Separator className="my-3" />
              <div>
                  <h5 className="text-md font-semibold mb-2 text-foreground flex items-center"><ListChecks size={16} className="mr-2 text-primary" /> {messages.pitBracketsTitle}</h5>
                  <div className="overflow-x-auto text-xs pl-4">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 px-1 font-medium text-muted-foreground">{messages.pitBracketHeaderBracket}</th>
                          <th className="text-right py-1 px-1 font-medium text-muted-foreground">{messages.pitBracketHeaderTaxable}</th>
                          <th className="text-center py-1 px-1 font-medium text-muted-foreground">{messages.pitBracketHeaderRate}</th>
                          <th className="text-right py-1 px-1 font-medium text-muted-foreground">{messages.pitBracketHeaderTaxAmount}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.progressiveTaxDetails.map((detail, index) => (
                          (detail.incomeInBracket > 0 || breakdown.personalIncomeTax === 0 || index === 0 ) && <tr key={index} className="border-b hover:bg-secondary/20 last:border-b-0">
                            <td className="py-1 px-1 text-muted-foreground">{detail.bracketLabel}</td>
                            <td className="py-1 px-1 text-right text-foreground">{formatCurrency(detail.incomeInBracket, "VND", locale)}</td>
                            <td className="py-1 px-1 text-center text-foreground">{(detail.rate * 100).toFixed(0)}%</td>
                            <td className="py-1 px-1 text-right text-foreground">{formatCurrency(detail.taxAmountInBracket, "VND", locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            </>
          )}
          
          <Separator />

          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="text-lg font-bold text-primary">{messages.totalDeductionsLabel}</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(breakdown.totalDeductionsFromGross, "VND", locale)}</span>
          </div>

          <Separator className="my-6" />

          <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Briefcase size={20} className="mr-2 text-primary" />{messages.employerContributionsTitle}</h3>
              <div className="space-y-1 pl-4 text-sm">
                  <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                      <span className="text-muted-foreground">{messages.grossSalary}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.grossSalaryVND, "VND", locale)}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                      <span className="text-muted-foreground">{messages.employerBHXH}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.employerContributions.bhxh, "VND", locale)}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                      <span className="text-muted-foreground">{messages.employerBHYT}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.employerContributions.bhyt, "VND", locale)}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                      <span className="text-muted-foreground">{messages.employerBHTN}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.employerContributions.bhtn, "VND", locale)}</span>
                  </div>
                  {breakdown.employerContributions.tradeUnionFee > 0 && (
                    <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                        <span className="text-muted-foreground">{messages.employerTradeUnionFee}</span>
                        <span className="text-foreground">{formatCurrency(breakdown.employerContributions.tradeUnionFee, "VND", locale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                      <span className="text-muted-foreground">{messages.totalEmployerContributions}</span>
                      <span className="text-foreground">{formatCurrency(breakdown.employerContributions.total, "VND", locale)}</span>
                  </div>
              </div>
              <div className="flex justify-between items-center p-3 mt-4 bg-primary/10 rounded-lg">
                  <span className="text-lg font-bold text-primary">{messages.totalEmployerCostLabel}</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(breakdown.totalEmployerCost, "VND", locale)}</span>
              </div>
          </div>

          <Separator className="my-6" />
          
          <div>
            <h3 className="text-xl font-semibold mb-1 text-foreground flex items-center">
              <PieChartIcon size={20} className="mr-2 text-primary" />
              {messages.chartTitle}
            </h3>
            {breakdown.grossSalaryVND > 0 && chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px] min-h-[250px]">
                <RechartsPieChart accessibilityLayer>
                  <RechartsTooltip
                    cursor={true}
                    content={<ChartTooltipContent 
                                nameKey="name" 
                                hideLabel 
                                formatter={(value, name, item) => (
                                    <div className="flex flex-col">
                                        <span>{item.payload.name}</span>
                                        <span className="font-bold">{formatCurrency(value as number, "VND", locale)} ({(( (value as number) / breakdown.grossSalaryVND) * 100).toFixed(1)}%)</span>
                                    </div>
                                )}
                            />}
                  />
                  <RechartsPie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                      if (percent * 100 < 3) return null; 
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central" fontSize="10px" fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke={"hsl(var(--background))"} strokeWidth={2} />
                    ))}
                  </RechartsPie>
                  <ChartLegend
                    layout="vertical"
                    verticalAlign="middle"
                    align="left"
                    content={
                      <ChartLegendContent
                        nameKey="name"
                        className="text-xs flex flex-col items-start gap-2"
                      />
                    }
                  />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">{messages.chartNoData}</p>
            )}
          </div>
        </CardContent>
      </div>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button onClick={handleCopyToClipboard} variant="outline" className="w-full sm:w-auto flex-1">
          {copied ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? messages.copiedButton : messages.copyButton}
        </Button>
        <Button onClick={handleExportToExcel} variant="outline" className="w-full sm:w-auto flex-1">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {messages.exportExcelButton}
        </Button>
        <Button onClick={handleExportToPDF} variant="outline" className="w-full sm:w-auto flex-1">
          <Printer className="mr-2 h-4 w-4" />
          {messages.exportPDFButton}
        </Button>
      </CardFooter>
    </Card>
  );
}
