
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRightLeft,
  Calculator,
  DollarSign,
  Coins,
  Repeat,
  Shield,
  Percent,
  MapPin,
  Users,
  Globe2,
} from "lucide-react";

import type { SalaryInput, Currency, InsuranceBasis, TaxCalculationMethod, Region, Nationality } from "@/types/salary";
import { REGION_OPTIONS, CURRENCY_OPTIONS, NATIONALITY_OPTIONS } from "@/types/salary";

const formSchema = z.object({
  salaryInput: z.coerce.number().min(0, "Thu nhập phải là số dương"),
  currency: z.enum(["VND", "USD", "JPY"]),
  exchangeRate: z.coerce.number().optional(),
  insuranceBasis: z.enum(["official", "custom"]),
  insuranceCustom: z.coerce.number().optional(),
  taxCalculationMethod: z.enum(["progressive", "flat10"]),
  region: z.coerce.number().min(1).max(4).transform(val => val as Region),
  dependents: z.coerce.number().min(0, "Số người phụ thuộc không thể âm").int("Số người phụ thuộc phải là số nguyên"),
  nationality: z.enum(["VN", "Foreign"]),
}).superRefine((data, ctx) => {
  if (data.currency !== "VND" && (data.exchangeRate === undefined || data.exchangeRate <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tỷ giá hối đoái là bắt buộc và phải lớn hơn 0 khi chọn ngoại tệ.",
      path: ["exchangeRate"],
    });
  }
  if (data.insuranceBasis === "custom" && (data.insuranceCustom === undefined || data.insuranceCustom <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mức đóng bảo hiểm tùy chọn là bắt buộc và phải lớn hơn 0.",
      path: ["insuranceCustom"],
    });
  }
});

type SalaryFormValues = z.infer<typeof formSchema>;

interface SalaryFormProps {
  onSubmit: (data: SalaryInput) => void;
  isGrossMode: boolean;
  onModeChange: (isGross: boolean) => void;
  initialValues?: Partial<SalaryFormValues>;
}

const defaultValues: Partial<SalaryFormValues> = {
  salaryInput: 50000000,
  currency: "VND",
  exchangeRate: 25000,
  insuranceBasis: "official",
  taxCalculationMethod: "progressive",
  region: 1,
  dependents: 0,
  nationality: "VN",
};

// Helper function to format number to VN style for input display
const formatVNNumberForInput = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const numStr = String(value).replace(/\D/g, ''); // Get only digits
  if (numStr === '') return '';
  
  const num = Number(numStr);
  if (isNaN(num)) return '';

  return new Intl.NumberFormat('vi-VN').format(num);
};

// Helper function to clean string to numeric string (digits only)
const cleanToNumericString = (value: string | undefined): string => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\D/g, '');
};


export default function SalaryForm({ onSubmit, isGrossMode, onModeChange, initialValues }: SalaryFormProps) {
  const { toast } = useToast();
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const watchedCurrency = form.watch("currency");
  const watchedInsuranceBasis = form.watch("insuranceBasis");

  function handleFormSubmit(values: SalaryFormValues) {
    const salaryData: SalaryInput = {
      ...values,
      isGrossMode,
      // Ensure exchangeRate and insuranceCustom are numbers or undefined correctly
      // Zod coercion already handles conversion from string (from input) to number
      exchangeRate: values.currency === 'VND' ? undefined : values.exchangeRate,
      insuranceCustom: values.insuranceBasis === 'custom' ? values.insuranceCustom : undefined,
      region: values.region as Region,
      nationality: values.nationality as Nationality,
    };
    onSubmit(salaryData);
    toast({
      title: "Đã tính toán!",
      description: "Kiểm tra kết quả bên dưới.",
    });
  }

  const getExchangeRateLabel = (currency: Currency | undefined) => {
    if (currency === "USD") return "Tỷ giá (1 USD = ? VND)";
    if (currency === "JPY") return "Tỷ giá (1 JPY = ? VND)";
    return "Tỷ giá";
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Calculator className="mr-2" /> Thông tin tính lương
        </CardTitle>
        <CardDescription>Nhập các thông tin cần thiết để tính lương Gross ↔ Net.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            
            <div className="flex items-center space-x-4 p-4 bg-secondary/30 rounded-lg shadow-sm">
              <ArrowRightLeft size={24} className="text-primary" />
              <FormLabel className="text-lg font-semibold">Chế độ tính: {isGrossMode ? "Gross sang Net" : "Net sang Gross"}</FormLabel>
              <Switch
                checked={!isGrossMode} // if checked, it's Net to Gross (isGrossMode = false)
                onCheckedChange={(checked) => onModeChange(!checked)}
                aria-label="Chuyển chế độ Gross/Net"
              />
            </div>
            
            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="salaryInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><DollarSign size={16} className="mr-1 text-primary" /> Thu nhập ({isGrossMode ? "Gross" : "Net"})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nhập số tiền"
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                          field.onChange(numericString); // Zod coerce will handle conversion to number
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Coins size={16} className="mr-1 text-primary" /> Loại tiền tệ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại tiền" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedCurrency !== "VND" && (
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Repeat size={16} className="mr-1 text-primary" /> {getExchangeRateLabel(watchedCurrency)}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nhập tỷ giá"
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                          // For optional fields, pass undefined if empty, otherwise the numeric string
                          field.onChange(numericString === '' ? undefined : numericString);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Separator />

            <FormField
              control={form.control}
              name="insuranceBasis"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-md font-semibold flex items-center"><Shield size={18} className="mr-1 text-primary" /> Tùy chọn đóng bảo hiểm</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="official" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Trên lương chính thức (Gross)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Khác (tự nhập mức đóng BH)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedInsuranceBasis === "custom" && (
              <FormField
                control={form.control}
                name="insuranceCustom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mức lương cơ sở đóng bảo hiểm (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nhập mức đóng BH tùy chọn"
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                           // For optional fields, pass undefined if empty
                          field.onChange(numericString === '' ? undefined : numericString);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Đây là mức lương làm cơ sở để tính các khoản BHXH, BHYT, BHTN.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <FormField
              control={form.control}
              name="taxCalculationMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-md font-semibold flex items-center"><Percent size={18} className="mr-1 text-primary" /> Phương thức tính thuế TNCN</FormLabel>
                   <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="progressive" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Lũy tiến từng phần
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flat10" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Thuế suất cố định 10% (trên thu nhập trước thuế, sau BH)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            
            <div className="grid md:grid-cols-3 gap-6">
               <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin size={16} className="mr-1 text-primary" /> Vùng</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vùng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGION_OPTIONS.map(opt => (
                           <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Ảnh hưởng mức lương tối thiểu đóng BH.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dependents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users size={16} className="mr-1 text-primary" /> Số người phụ thuộc</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Nhập số người" {...field} />
                    </FormControl>
                     <FormDescription>Số người được giảm trừ gia cảnh.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe2 size={16} className="mr-1 text-primary" /> Quốc tịch</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn quốc tịch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NATIONALITY_OPTIONS.map(opt => (
                           <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Ảnh hưởng cách tính thuế TNCN.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
              <Calculator className="mr-2 h-5 w-5" />
              Tính lương
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
