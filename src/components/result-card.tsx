"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, FileText, CircleDollarSign, Shield, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SalaryResult } from "@/types/salary";
import { useState, useEffect } from "react";

interface ResultCardProps {
  result: SalaryResult | null;
}

const formatCurrency = (value: number, currency: string = "VND") => {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency }).format(value);
  } catch (e) { // Fallback for unknown currency or other errors
    return `${value.toLocaleString('vi-VN')} ${currency}`;
  }
};

export default function ResultCard({ result }: ResultCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyToClipboard = () => {
    if (!result) return;

    const { gross, net, breakdown, isGrossMode, originalAmount, currency } = result;
    const inputType = isGrossMode ? "Gross" : "Net";
    const outputType = isGrossMode ? "Net" : "Gross";
    const outputValue = isGrossMode ? net : gross;

    const textToCopy = `
VN Salary Calculation Result:
---------------------------------
Input Salary (${inputType} ${currency}): ${formatCurrency(originalAmount, currency)}
Calculated ${outputType} (${currency}): ${formatCurrency(outputValue, currency)}
---------------------------------
Details (VND):
Gross Salary: ${formatCurrency(breakdown.grossSalaryVND)}
Net Salary: ${formatCurrency(breakdown.netSalaryVND)}
Insurance Base: ${formatCurrency(breakdown.insurance.base)}
  - BHXH (8%): ${formatCurrency(breakdown.insurance.bhxh)}
  - BHYT (1.5%): ${formatCurrency(breakdown.insurance.bhyt)}
  - BHTN (1%): ${formatCurrency(breakdown.insurance.bhtn)}
  - Total Insurance: ${formatCurrency(breakdown.insurance.total)}
Taxable Income: ${formatCurrency(breakdown.taxableIncome)}
Personal Income Tax (PIT): ${formatCurrency(breakdown.personalIncomeTax)}
Total Deductions (Insurance + PIT): ${formatCurrency(breakdown.totalDeductionsFromGross)}
---------------------------------
Calculation based on provided inputs.
    `;
    navigator.clipboard.writeText(textToCopy.trim())
      .then(() => {
        setCopied(true);
        toast({
          title: "Đã sao chép!",
          description: "Kết quả đã được sao chép vào clipboard.",
          action: <CheckCircle className="text-green-500" />,
        });
      })
      .catch(err => {
        toast({
          variant: "destructive",
          title: "Lỗi sao chép",
          description: "Không thể sao chép kết quả.",
          action: <AlertTriangle className="text-red-500" />,
        });
      });
  };

  if (!result) {
    return (
      <Card className="w-full mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <FileText className="mr-2" /> Kết quả tính lương
          </CardTitle>
          <CardDescription>Nhập thông tin và nhấn "Tính lương" để xem kết quả chi tiết.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Chưa có kết quả để hiển thị.</p>
        </CardContent>
      </Card>
    );
  }

  const { gross, net, breakdown, isGrossMode, currency, originalAmount } = result;
  const displayInputType = isGrossMode ? "Gross" : "Net";
  const displayOutputType = isGrossMode ? "Net" : "Gross";
  const displayOutputValue = isGrossMode ? net : gross;

  return (
    <Card className="w-full mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center">
          {isGrossMode ? <TrendingDown className="mr-2 text-red-500" /> : <TrendingUp className="mr-2 text-green-500" />}
          Kết quả: Lương {displayOutputType} ước tính
        </CardTitle>
        <CardDescription>
          Từ lương {displayInputType} đầu vào: {formatCurrency(originalAmount, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-6 bg-accent/20 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">LƯƠNG {displayOutputType.toUpperCase()} NHẬN ĐƯỢC ({currency})</p>
          <p className="text-4xl font-bold text-primary mt-1">
            {formatCurrency(displayOutputValue, currency)}
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><CircleDollarSign size={20} className="mr-2 text-primary" />Chi tiết (VND)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/50">
              <span className="font-medium text-muted-foreground">Lương Gross:</span>
              <span className="font-semibold text-foreground">{formatCurrency(breakdown.grossSalaryVND)}</span>
            </div>
             <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/50">
              <span className="font-medium text-muted-foreground">Lương Net (thực nhận):</span>
              <span className="font-semibold text-foreground">{formatCurrency(breakdown.netSalaryVND)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
            <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Shield size={18} className="mr-2 text-primary" />Các khoản bảo hiểm:</h4>
            <div className="space-y-1 pl-4 text-sm">
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">Mức lương đóng BH:</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.base)}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHXH (8%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhxh)}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHYT (1.5%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhyt)}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHTN (1%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhtn)}</span>
              </div>
              <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                  <span className="text-muted-foreground">Tổng bảo hiểm:</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.total)}</span>
              </div>
            </div>
        </div>

        <Separator />
        
        <div>
            <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Percent size={18} className="mr-2 text-primary" />Thuế thu nhập cá nhân (TNCN):</h4>
            <div className="space-y-1 pl-4 text-sm">
                 <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">Thu nhập chịu thuế:</span>
                    <span className="text-foreground">{formatCurrency(breakdown.taxableIncome)}</span>
                </div>
                <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                    <span className="text-muted-foreground">Tiền thuế TNCN:</span>
                    <span className="text-foreground">{formatCurrency(breakdown.personalIncomeTax)}</span>
                </div>
            </div>
        </div>
        
        <Separator />

        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
            <span className="text-lg font-bold text-primary">Tổng khấu trừ (BH + Thuế TNCN):</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(breakdown.totalDeductionsFromGross)}</span>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
          {copied ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Đã sao chép" : "Sao chép kết quả"}
        </Button>
      </CardFooter>
    </Card>
  );
}
