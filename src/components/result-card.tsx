
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, FileText, CircleDollarSign, Shield, Percent, PieChart as PieChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SalaryResult } from "@/types/salary";
import { useState, useEffect } from "react";

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
}

const formatCurrency = (value: number, currency: string = "VND") => {
  if (isNaN(value)) value = 0; // Handle NaN gracefully

  if (currency === "VND") {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return value.toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
  } else {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol', // Use symbol for non-VND like $ or ¥
      }).format(value);
    } catch (e) {
      const numericPart = new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(value);
      return `${numericPart} ${currency}`;
    }
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
    
    const formatCurrencyStyleForClipboard = (val: number, curr: string) => {
        if (isNaN(val)) val = 0;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: curr, currencyDisplay: 'code' }).format(val);
    }

    const textToCopy = `
VN Salary Calculation Result:
---------------------------------
Input Salary (${inputType} ${currency}): ${formatCurrencyStyleForClipboard(originalAmount, currency)}
Calculated ${outputType} (${currency}): ${formatCurrencyStyleForClipboard(outputValue, currency)}
---------------------------------
Details (all amounts in VND):
Gross Salary: ${formatCurrency(breakdown.grossSalaryVND, "VND")} VND
Net Salary: ${formatCurrency(breakdown.netSalaryVND, "VND")} VND
Insurance Base: ${formatCurrency(breakdown.insurance.base, "VND")} VND
  - BHXH (8%): ${formatCurrency(breakdown.insurance.bhxh, "VND")} VND
  - BHYT (1.5%): ${formatCurrency(breakdown.insurance.bhyt, "VND")} VND
  - BHTN (1%): ${formatCurrency(breakdown.insurance.bhtn, "VND")} VND
  - Total Insurance: ${formatCurrency(breakdown.insurance.total, "VND")} VND
Taxable Income: ${formatCurrency(breakdown.taxableIncome, "VND")} VND
Personal Income Tax (PIT): ${formatCurrency(breakdown.personalIncomeTax, "VND")} VND
Total Deductions (Insurance + PIT): ${formatCurrency(breakdown.totalDeductionsFromGross, "VND")} VND
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

  const chartData = breakdown.grossSalaryVND > 0 ? [
    { name: "BHXH", value: breakdown.insurance.bhxh, fill: "hsl(var(--chart-1))" },
    { name: "BHYT", value: breakdown.insurance.bhyt, fill: "hsl(var(--chart-2))" },
    { name: "BHTN", value: breakdown.insurance.bhtn, fill: "hsl(var(--chart-3))" },
    { name: "Thuế TNCN", value: breakdown.personalIncomeTax, fill: "hsl(var(--chart-4))" },
    { name: "Lương thực nhận", value: breakdown.netSalaryVND, fill: "hsl(var(--chart-5))" },
  ].filter(item => item.value > 0) : []; // Filter out zero/negative values for cleaner chart

  const chartConfig = {
    "BHXH": { label: "BHXH", color: "hsl(var(--chart-1))" },
    "BHYT": { label: "BHYT", color: "hsl(var(--chart-2))" },
    "BHTN": { label: "BHTN", color: "hsl(var(--chart-3))" },
    "Thuế TNCN": { label: "Thuế TNCN", color: "hsl(var(--chart-4))" },
    "Lương thực nhận": { label: "Lương thực nhận", color: "hsl(var(--chart-5))" },
  } satisfies ChartConfig;


  return (
    <Card className="w-full mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center">
          {isGrossMode ? <TrendingDown className="mr-2 text-red-500" /> : <TrendingUp className="mr-2 text-green-500" />}
          Kết quả: Lương {displayOutputType} ước tính
        </CardTitle>
        <CardDescription>
          Từ lương {displayInputType} đầu vào: {formatCurrency(originalAmount, currency)} {currency !== "VND" ? "" : currency}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-6 bg-accent/20 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">LƯƠNG {displayOutputType.toUpperCase()} NHẬN ĐƯỢC {currency !== "VND" ? `(${currency})` : "(VND)"}</p>
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
              <span className="font-semibold text-foreground">{formatCurrency(breakdown.grossSalaryVND, "VND")}</span>
            </div>
             <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/50">
              <span className="font-medium text-muted-foreground">Lương Net (thực nhận):</span>
              <span className="font-semibold text-foreground">{formatCurrency(breakdown.netSalaryVND, "VND")}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
            <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Shield size={18} className="mr-2 text-primary" />Các khoản bảo hiểm:</h4>
            <div className="space-y-1 pl-4 text-sm">
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">Mức lương đóng BH:</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.base, "VND")}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHXH (8%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhxh, "VND")}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHYT (1.5%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhyt, "VND")}</span>
              </div>
              <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                  <span className="text-muted-foreground">BHTN (1%):</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.bhtn, "VND")}</span>
              </div>
              <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                  <span className="text-muted-foreground">Tổng bảo hiểm:</span>
                  <span className="text-foreground">{formatCurrency(breakdown.insurance.total, "VND")}</span>
              </div>
            </div>
        </div>

        <Separator />
        
        <div>
            <h4 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Percent size={18} className="mr-2 text-primary" />Thuế thu nhập cá nhân (TNCN):</h4>
            <div className="space-y-1 pl-4 text-sm">
                 <div className="flex justify-between items-center p-1 rounded hover:bg-secondary/30">
                    <span className="text-muted-foreground">Thu nhập chịu thuế:</span>
                    <span className="text-foreground">{formatCurrency(breakdown.taxableIncome, "VND")}</span>
                </div>
                <div className="flex justify-between items-center p-1 font-semibold rounded bg-secondary/50 mt-1">
                    <span className="text-muted-foreground">Tiền thuế TNCN:</span>
                    <span className="text-foreground">{formatCurrency(breakdown.personalIncomeTax, "VND")}</span>
                </div>
            </div>
        </div>
        
        <Separator />

        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
            <span className="text-lg font-bold text-primary">Tổng khấu trừ (BH + Thuế TNCN):</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(breakdown.totalDeductionsFromGross, "VND")}</span>
        </div>

        <Separator className="my-6" />
        
        <div>
          <h3 className="text-xl font-semibold mb-1 text-foreground flex items-center">
            <PieChartIcon size={20} className="mr-2 text-primary" />
            Biểu đồ phân bổ lương Gross
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
                                      <span className="font-bold">{formatCurrency(value, "VND")} ({((value / breakdown.grossSalaryVND) * 100).toFixed(1)}%)</span>
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
                <ChartLegend content={<ChartLegendContent nameKey="name" className="text-xs [&_div]:inline-block [&_div]:truncate [&_div]:max-w-[100px] sm:[&_div]:max-w-[180px]" />} />
              </RechartsPieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-4">Không đủ dữ liệu để vẽ biểu đồ (Lương Gross cần lớn hơn 0).</p>
          )}
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

    