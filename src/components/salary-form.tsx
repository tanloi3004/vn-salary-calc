
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import docso from 'docso';

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
import { Checkbox } from "@/components/ui/checkbox";
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
  Info,
  Briefcase,
} from "lucide-react";

import type { SalaryInput, Currency, Region, Nationality } from "@/types/salary";
import { REGION_OPTION_KEYS, CURRENCY_OPTION_KEYS, NATIONALITY_OPTION_KEYS, REGION_MINIMUM_WAGE_VND_LEGAL, BASE_SALARY_VND_LEGAL } from "@/types/salary";

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


const formSchema = z.object({
  salaryInput: z.coerce.number().min(0, "Thu nhập phải là số dương"),
  currency: z.enum(["VND", "USD", "JPY"]),
  usdExchangeRate: z.coerce.number().positive("Tỷ giá USD phải là số dương"),
  jpyExchangeRate: z.coerce.number().optional(),
  insuranceBasis: z.enum(["official", "custom"]),
  insuranceCustom: z.coerce.number().optional(),
  taxCalculationMethod: z.enum(["progressive", "flat10"]),
  region: z.coerce.number().min(1).max(4).transform(val => val as Region),
  dependents: z.coerce.number().min(0, "Số người phụ thuộc không thể âm").int("Số người phụ thuộc phải là số nguyên"),
  nationality: z.enum(["VN", "Foreign"]),
  hasTradeUnionFee: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.currency === "JPY" && (data.jpyExchangeRate === undefined || data.jpyExchangeRate <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tỷ giá JPY là bắt buộc và phải lớn hơn 0 khi chọn JPY.", // This refine message should also be translatable
      path: ["jpyExchangeRate"],
    });
  }
  if (data.insuranceBasis === "custom" && (data.insuranceCustom === undefined || data.insuranceCustom <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mức đóng bảo hiểm tùy chọn là bắt buộc và phải lớn hơn 0.", // This refine message should also be translatable
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
  locale: string;
  messages: any; // Type for salaryForm messages
  generalMessages: any; // Type for general messages (toasts)
}

const defaultValues: Partial<SalaryFormValues> = {
  salaryInput: 50000000,
  currency: "VND",
  usdExchangeRate: 25000,
  // jpyExchangeRate will be undefined by default
  insuranceBasis: "official",
  taxCalculationMethod: "progressive",
  region: 1,
  dependents: 0,
  nationality: "VN",
  hasTradeUnionFee: false,
};

const formatVNNumberForInput = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const numStr = String(value).replace(/\D/g, '');
  if (numStr === '') return '';
  const num = Number(numStr);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
};

const cleanToNumericString = (value: string | undefined): string => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\D/g, '');
};


export default function SalaryForm({ onSubmit, isGrossMode, onModeChange, initialValues, locale, messages, generalMessages }: SalaryFormProps) {
  const { toast } = useToast();
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const watchedCurrency = form.watch("currency");
  const watchedInsuranceBasis = form.watch("insuranceBasis");
  const watchedSalaryInput = form.watch("salaryInput");
  const watchedRegion = form.watch("region");
  const [salaryInWords, setSalaryInWords] = useState('');

  useEffect(() => {
    const numericValue = form.getValues("salaryInput");
    if (locale === 'vi' && typeof numericValue === 'number' && !isNaN(numericValue) && numericValue >= 0) {
      try {
        const words = docso(numericValue);
        const capitalizedWords = words.charAt(0).toUpperCase() + words.slice(1);
        setSalaryInWords(capitalizedWords + " " + messages.salaryInWordsSuffix);
      } catch (e) {
        setSalaryInWords('');
      }
    } else {
      setSalaryInWords('');
    }
  }, [watchedSalaryInput, form, locale, messages.salaryInWordsSuffix]);


  function handleFormSubmit(values: SalaryFormValues) {
    const salaryData: SalaryInput = {
      ...values,
      isGrossMode,
      usdExchangeRate: values.usdExchangeRate,
      jpyExchangeRate: values.currency === 'JPY' ? values.jpyExchangeRate : undefined,
      insuranceCustom: values.insuranceBasis === 'custom' ? values.insuranceCustom : undefined,
      region: values.region as Region,
      nationality: values.nationality as Nationality,
      hasTradeUnionFee: values.hasTradeUnionFee,
    };
    onSubmit(salaryData);
    toast({
      title: generalMessages.calculationDoneToast,
      description: generalMessages.calculationDoneDesc,
    });
  }
  
  const currentRegionMinimumWage = watchedRegion ? REGION_MINIMUM_WAGE_VND_LEGAL[watchedRegion as Region] : null;
  const currentRegionName = REGION_OPTION_KEYS.find(opt => opt.value === watchedRegion)?.labelKey;
  const regionNameText = currentRegionName ? getMsg(messages, currentRegionName, `Region ${watchedRegion}`) : `Region ${watchedRegion}`;


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Calculator className="mr-2" /> {messages.title}
        </CardTitle>
        <CardDescription>{messages.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">

            <div className="flex items-center space-x-4 p-4 bg-secondary/30 rounded-lg shadow-sm">
              <ArrowRightLeft size={24} className="text-primary" />
              <FormLabel className="text-lg font-semibold">{messages.modeLabel} {isGrossMode ? messages.grossToNet : messages.netToGross}</FormLabel>
              <Switch
                checked={!isGrossMode}
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
                    <FormLabel className="flex items-center"><DollarSign size={16} className="mr-1 text-primary" /> {messages.salaryInputLabel} ({isGrossMode ? "Gross" : "Net"})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={isGrossMode ? messages.salaryInputGrossPlaceholder : messages.salaryInputNetPlaceholder}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                          field.onChange(numericString === '' ? undefined : Number(numericString));
                        }}
                      />
                    </FormControl>
                    {salaryInWords && <FormDescription className="text-primary font-medium italic">{salaryInWords}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Coins size={16} className="mr-1 text-primary" /> {messages.currencyLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={messages.currencyLabel} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTION_KEYS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{getMsg(messages, opt.labelKey, opt.value)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="usdExchangeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Repeat size={16} className="mr-1 text-primary" /> {messages.exchangeRateLabelUSD}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={messages.exchangeRatePlaceholder}
                      {...field}
                      value={formatVNNumberForInput(field.value)}
                      onChange={(e) => {
                        const numericString = cleanToNumericString(e.target.value);
                         field.onChange(numericString === '' ? undefined : Number(numericString));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedCurrency === "JPY" && (
              <FormField
                control={form.control}
                name="jpyExchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Repeat size={16} className="mr-1 text-primary" /> {messages.exchangeRateLabelJPY}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={messages.exchangeRatePlaceholderJPY}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                           field.onChange(numericString === '' ? undefined : Number(numericString));
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
                  <FormLabel className="text-md font-semibold flex items-center"><Shield size={18} className="mr-1 text-primary" /> {messages.insuranceBasisLabel}</FormLabel>
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
                          {messages.insuranceBasisOfficial}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" />
                        </FormControl>
                        <FormLabel className="font-normal">
                         {messages.insuranceBasisCustom}
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
                    <FormLabel>{messages.insuranceCustomLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={messages.insuranceCustomPlaceholder}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                           field.onChange(numericString === '' ? undefined : Number(numericString));
                        }}
                      />
                    </FormControl>
                    <FormDescription>{messages.insuranceCustomDescription}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Separator />

            <FormField
              control={form.control}
              name="hasTradeUnionFee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center cursor-pointer">
                      <Briefcase size={16} className="mr-2 text-primary" />
                      {messages.hasTradeUnionFeeLabel}
                    </FormLabel>
                    <FormDescription>
                     {messages.hasTradeUnionFeeDescription}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="taxCalculationMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-md font-semibold flex items-center"><Percent size={18} className="mr-1 text-primary" /> {messages.taxCalculationMethodLabel}</FormLabel>
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
                          {messages.taxProgressive}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flat10" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {messages.taxFlat10}
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
                    <FormLabel className="flex items-center"><MapPin size={16} className="mr-1 text-primary" /> {messages.regionLabel}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value) as Region)} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={messages.regionPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGION_OPTION_KEYS.map(opt => (
                           <SelectItem key={opt.value} value={String(opt.value)}>{getMsg(messages, opt.labelKey, `Region ${opt.value}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentRegionMinimumWage && (
                      <div className="mt-2 space-y-1">
                        <FormDescription className="flex items-center text-xs">
                          <Info size={12} className="mr-1 text-muted-foreground" />
                           {messages.regionInfoMinWage
                            .replace("{regionName}", regionNameText)
                            .replace("{amount}", formatVNNumberForInput(currentRegionMinimumWage))}
                        </FormDescription>
                        <FormDescription className="flex items-center text-xs">
                          <Info size={12} className="mr-1 text-muted-foreground" />
                          {messages.regionInfoBaseSalary.replace("{amount}",formatVNNumberForInput(BASE_SALARY_VND_LEGAL))}
                        </FormDescription>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dependents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users size={16} className="mr-1 text-primary" /> {messages.dependentsLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={messages.dependentsPlaceholder} {...field}
                       onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          field.onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                     <FormDescription>{messages.dependentsDescription}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe2 size={16} className="mr-1 text-primary" /> {messages.nationalityLabel}</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={messages.nationalityPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NATIONALITY_OPTION_KEYS.map(opt => (
                           <SelectItem key={opt.value} value={opt.value}>{getMsg(messages, opt.labelKey, opt.value)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{messages.nationalityDescription}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
              <Calculator className="mr-2 h-5 w-5" />
              {messages.calculateButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
