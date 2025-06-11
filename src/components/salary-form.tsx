
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
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


const createFormSchema = (salaryFormMessages: any) => z.object({
  salaryInput: z.coerce.number().min(0, getMsg(salaryFormMessages, 'salaryInputErrorMin', "Income must be a non-negative number.")),
  currency: z.enum(["VND", "USD", "JPY"]),
  usdExchangeRate: z.coerce.number().positive(getMsg(salaryFormMessages, 'usdExchangeRateErrorPositive', "USD exchange rate must be positive.")),
  jpyExchangeRate: z.coerce.number().optional(),
  insuranceBasis: z.enum(["official", "custom"]),
  insuranceCustom: z.coerce.number().optional(),
  taxCalculationMethod: z.enum(["progressive", "flat10"]),
  region: z.coerce.number().min(1).max(4).transform(val => val as Region),
  dependents: z.coerce.number().min(0, getMsg(salaryFormMessages, 'dependentsErrorMin', "Number of dependents cannot be negative.")).int(getMsg(salaryFormMessages, 'dependentsErrorInt', "Number of dependents must be an integer.")),
  nationality: z.enum(["VN", "Foreign"]),
  hasTradeUnionFee: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.currency === "JPY" && (data.jpyExchangeRate === undefined || data.jpyExchangeRate <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: getMsg(salaryFormMessages, 'jpyExchangeRateErrorRequired', "JPY exchange rate is required and must be positive when JPY is selected."),
      path: ["jpyExchangeRate"],
    });
  }
  if (data.insuranceBasis === "custom" && (data.insuranceCustom === undefined || data.insuranceCustom <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: getMsg(salaryFormMessages, 'insuranceCustomErrorRequired', "Custom insurance base is required and must be positive."),
      path: ["insuranceCustom"],
    });
  }
});

type SalaryFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface SalaryFormProps {
  onSubmit: (data: SalaryInput) => void;
  isGrossMode: boolean;
  onModeChange: (isGross: boolean) => void;
  initialValues?: Partial<SalaryFormValues>;
  locale: string;
  allLocaleMessages: any; // Full locale messages object
  generalMessages: any; 
}

const defaultValues: Partial<SalaryFormValues> = {
  salaryInput: 50000000,
  currency: "VND",
  usdExchangeRate: 25000,
  insuranceBasis: "official",
  taxCalculationMethod: "progressive",
  region: 1,
  dependents: 0,
  nationality: "VN",
  hasTradeUnionFee: false,
};

const formatVNNumberForInput = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) return '';
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


export default function SalaryForm({ onSubmit, isGrossMode, onModeChange, initialValues, locale, allLocaleMessages, generalMessages }: SalaryFormProps) {
  const { toast } = useToast();
  
  const currentFormSchema = useMemo(() => createFormSchema(allLocaleMessages.salaryForm), [allLocaleMessages.salaryForm]);

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const watchedCurrency = form.watch("currency");
  const watchedInsuranceBasis = form.watch("insuranceBasis");
  const watchedSalaryInput = form.watch("salaryInput"); 
  const watchedRegion = form.watch("region");
  const [salaryInWords, setSalaryInWords] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      const numericValue = form.getValues("salaryInput");
      if (locale === 'vi' && typeof numericValue === 'number' && !isNaN(numericValue) && numericValue >= 0) {
        try {
          const words = docso(numericValue);
          const capitalizedWords = words.charAt(0).toUpperCase() + words.slice(1);
          setSalaryInWords(capitalizedWords + " " + getMsg(allLocaleMessages.salaryForm, "salaryInWordsSuffix", "đồng"));
        } catch (e) {
          setSalaryInWords('');
        }
      } else {
        setSalaryInWords('');
      }
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [watchedSalaryInput, form, locale, allLocaleMessages.salaryForm]);


  function handleFormSubmit(values: SalaryFormValues) {
    const salaryData: SalaryInput = {
      ...values,
      salaryInput: typeof values.salaryInput === 'number' && !isNaN(values.salaryInput) ? values.salaryInput : 0,
      isGrossMode,
      usdExchangeRate: values.usdExchangeRate,
      jpyExchangeRate: values.currency === 'JPY' ? values.jpyExchangeRate : undefined,
      insuranceCustom: values.insuranceBasis === 'custom' ? values.insuranceCustom : undefined,
      region: values.region as Region,
      nationality: values.nationality as Nationality,
      hasTradeUnionFee: !!values.hasTradeUnionFee,
    };
    onSubmit(salaryData);
    toast({
      title: getMsg(generalMessages, "calculationDoneToast"),
      description: getMsg(generalMessages, "calculationDoneDesc"),
    });
  }
  
  const currentRegionMinimumWage = watchedRegion ? REGION_MINIMUM_WAGE_VND_LEGAL[watchedRegion as Region] : null;
  const currentRegionNameKey = REGION_OPTION_KEYS.find(opt => opt.value === watchedRegion)?.labelKey;
  const regionNameText = currentRegionNameKey ? getMsg(allLocaleMessages.options, currentRegionNameKey, `Region ${watchedRegion}`) : `Region ${watchedRegion}`;


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Calculator className="mr-2" /> {getMsg(allLocaleMessages.salaryForm, "title", "Salary Calculation Information")}
        </CardTitle>
        <CardDescription>{getMsg(allLocaleMessages.salaryForm, "description", "Enter the necessary information to calculate Gross ↔ Net salary.")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">

            <div className="flex items-center space-x-4 p-4 bg-secondary/30 rounded-lg shadow-sm">
              <ArrowRightLeft size={24} className="text-primary" />
              <FormLabel className="text-lg font-semibold">{getMsg(allLocaleMessages.salaryForm, "modeLabel", "Calculation Mode:")} {isGrossMode ? getMsg(allLocaleMessages.salaryForm, "grossToNet", "Gross to Net") : getMsg(allLocaleMessages.salaryForm, "netToGross", "Net to Gross")}</FormLabel>
              <Switch
                checked={!isGrossMode}
                onCheckedChange={(checked) => onModeChange(!checked)}
                aria-label={getMsg(allLocaleMessages.salaryForm, "switchModeAriaLabel", "Switch Gross/Net mode")}
              />
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="salaryInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><DollarSign size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "salaryInputLabel", "Income")} ({isGrossMode ? getMsg(allLocaleMessages.options, "currencyGross", "Gross") : getMsg(allLocaleMessages.options, "currencyNet", "Net")})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={isGrossMode ? getMsg(allLocaleMessages.salaryForm, "salaryInputGrossPlaceholder", "Enter Gross salary") : getMsg(allLocaleMessages.salaryForm, "salaryInputNetPlaceholder", "Enter Net salary")}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                          field.onChange(numericString === '' ? NaN : Number(numericString)); 
                        }}
                      />
                    </FormControl>
                    {watchedCurrency === "VND" && salaryInWords && <FormDescription className="text-primary font-medium italic">{salaryInWords}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Coins size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "currencyLabel", "Currency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={getMsg(allLocaleMessages.salaryForm, "currencyLabel", "Currency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTION_KEYS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{getMsg(allLocaleMessages.options, opt.labelKey, opt.value)}</SelectItem>
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
                  <FormLabel className="flex items-center"><Repeat size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "exchangeRateLabelUSD", "Exchange Rate (1 USD = ? VND)")}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={getMsg(allLocaleMessages.salaryForm, "exchangeRatePlaceholder", "Enter USD to VND rate")}
                      {...field}
                      value={formatVNNumberForInput(field.value)}
                      onChange={(e) => {
                        const numericString = cleanToNumericString(e.target.value);
                         field.onChange(numericString === '' ? NaN : Number(numericString));
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
                    <FormLabel className="flex items-center"><Repeat size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "exchangeRateLabelJPY", "Exchange Rate (1 JPY = ? VND)")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={getMsg(allLocaleMessages.salaryForm, "exchangeRatePlaceholderJPY", "Enter JPY to VND rate")}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                           field.onChange(numericString === '' ? NaN : Number(numericString));
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
                  <FormLabel className="text-md font-semibold flex items-center"><Shield size={18} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "insuranceBasisLabel", "Insurance Contribution Basis")}</FormLabel>
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
                          {getMsg(allLocaleMessages.salaryForm, "insuranceBasisOfficial", "On official salary (Gross)")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" />
                        </FormControl>
                        <FormLabel className="font-normal">
                         {getMsg(allLocaleMessages.salaryForm, "insuranceBasisCustom", "Other (enter custom insurance base)")}
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
                    <FormLabel>{getMsg(allLocaleMessages.salaryForm, "insuranceCustomLabel", "Custom Insurance Base Salary (VND)")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={getMsg(allLocaleMessages.salaryForm, "insuranceCustomPlaceholder", "Enter custom insurance base")}
                        {...field}
                        value={formatVNNumberForInput(field.value)}
                        onChange={(e) => {
                          const numericString = cleanToNumericString(e.target.value);
                           field.onChange(numericString === '' ? NaN : Number(numericString));
                        }}
                      />
                    </FormControl>
                    <FormDescription>{getMsg(allLocaleMessages.salaryForm, "insuranceCustomDescription", "This is the base salary for calculating SI, HI, UI.")}</FormDescription>
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
                      {getMsg(allLocaleMessages.salaryForm, "hasTradeUnionFeeLabel", "Include Trade Union Fee (2% paid by employer)")}
                    </FormLabel>
                    <FormDescription>
                     {getMsg(allLocaleMessages.salaryForm, "hasTradeUnionFeeDescription", "The trade union fee is an employer contribution, not deducted from employee's salary.")}
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
                  <FormLabel className="text-md font-semibold flex items-center"><Percent size={18} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "taxCalculationMethodLabel", "PIT Calculation Method")}</FormLabel>
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
                          {getMsg(allLocaleMessages.salaryForm, "taxProgressive", "Progressive tax brackets")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flat10" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {getMsg(allLocaleMessages.salaryForm, "taxFlat10", "Flat 10% tax rate (on income before tax, after insurance)")}
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
                    <FormLabel className="flex items-center"><MapPin size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "regionLabel", "Region")}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value) as Region)} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={getMsg(allLocaleMessages.salaryForm, "regionPlaceholder", "Select region")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGION_OPTION_KEYS.map(opt => (
                           <SelectItem key={opt.value} value={String(opt.value)}>{getMsg(allLocaleMessages.options, opt.labelKey, `Region ${opt.value}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentRegionMinimumWage && (
                      <div className="mt-2 space-y-1">
                        <FormDescription className="flex items-center text-xs">
                          <Info size={12} className="mr-1 text-muted-foreground" />
                           {getMsg(allLocaleMessages.salaryForm, "regionInfoMinWage", "Min. wage {regionName}: {amount} VND")
                            .replace("{regionName}", regionNameText)
                            .replace("{amount}", formatVNNumberForInput(currentRegionMinimumWage))}
                        </FormDescription>
                        <FormDescription className="flex items-center text-xs">
                          <Info size={12} className="mr-1 text-muted-foreground" />
                          {getMsg(allLocaleMessages.salaryForm, "regionInfoBaseSalary", "Base salary (common): {amount} VND").replace("{amount}",formatVNNumberForInput(BASE_SALARY_VND_LEGAL))}
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
                    <FormLabel className="flex items-center"><Users size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "dependentsLabel", "Number of Dependents")}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={getMsg(allLocaleMessages.salaryForm, "dependentsPlaceholder", "Enter number")} {...field}
                       onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          field.onChange(isNaN(val) ? 0 : val); 
                        }}
                      />
                    </FormControl>
                     <FormDescription>{getMsg(allLocaleMessages.salaryForm, "dependentsDescription", "Number of people eligible for family allowances.")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe2 size={16} className="mr-1 text-primary" /> {getMsg(allLocaleMessages.salaryForm, "nationalityLabel", "Nationality")}</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={getMsg(allLocaleMessages.salaryForm, "nationalityPlaceholder", "Select nationality")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NATIONALITY_OPTION_KEYS.map(opt => (
                           <SelectItem key={opt.value} value={opt.value}>{getMsg(allLocaleMessages.options, opt.labelKey, opt.value)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{getMsg(allLocaleMessages.salaryForm, "nationalityDescription", "Affects PIT and UI calculations.")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
              <Calculator className="mr-2 h-5 w-5" />
              {getMsg(allLocaleMessages.salaryForm, "calculateButton", "Calculate Salary")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
