
"use client";

import { useState, use } from 'react'; // Added use
import SalaryForm from '@/components/salary-form';
import ResultCard from '@/components/result-card';
import type { SalaryInput, SalaryResult, CalculationHistoryEntry } from '@/types/salary';
import { computeSalary } from '@/lib/salary-calculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link2 } from "lucide-react";
import { LOCAL_STORAGE_HISTORY_KEY, MAX_HISTORY_ITEMS } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";

import viMessages from '@/locales/vi.json';
import enMessages from '@/locales/en.json';

interface HomePageProps {
  params: {
    locale: string;
  };
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


export default function HomePage({ params }: HomePageProps) { 
  const unwrappedParams = use(params as any); 
  const locale = unwrappedParams.locale; 

  const messages = locale === 'vi' ? viMessages : enMessages;
  const salaryFormMessages = messages.salaryForm;
  const resultCardMessages = messages.resultCard;
  const calculatorTabsMessages = messages.calculatorTabs;
  const generalMessages = messages.general;
  const legalBasisMessages = messages.legalBasis;


  const [isGrossMode, setIsGrossMode] = useState<boolean>(true);
  const [calculationResult, setCalculationResult] = useState<SalaryResult | null>(null);
  const [formKey, setFormKey] = useState<number>(Date.now());
  const { toast } = useToast();

  const handleFormSubmit = (data: SalaryInput) => {
    const result = computeSalary(data);
    setCalculationResult(result);

    const newHistoryEntry: CalculationHistoryEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      mode: data.isGrossMode ? 'GrossToNet' : 'NetToGross',
      inputSalary: data.salaryInput,
      inputCurrency: data.currency,
      calculatedGrossVND: result.breakdown.grossSalaryVND,
      calculatedNetVND: result.breakdown.netSalaryVND,
      fullInputSnapshot: data,
      fullResultSnapshot: result,
    };

    try {
      const existingHistoryString = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      let history: CalculationHistoryEntry[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
      history.unshift(newHistoryEntry); 
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
      toast({
        title: generalMessages.calculationSavedToast,
        description: generalMessages.calculationSavedDesc,
      });
    } catch (error) {
      console.error("Failed to save calculation history:", error);
      toast({
        variant: "destructive",
        title: generalMessages.errorSavingHistoryToast,
        description: generalMessages.errorSavingHistoryDesc,
      });
    }
  };

  const handleModeChange = (newIsGrossMode: boolean) => {
    setIsGrossMode(newIsGrossMode);
    setCalculationResult(null);
    setFormKey(Date.now());
  };

  const initialFormValues = calculationResult
    ? { salaryInput: isGrossMode ? calculationResult.gross : calculationResult.net, currency: calculationResult.currency }
    : undefined;

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="lg:sticky lg:top-8">
           <SalaryForm
            key={formKey}
            onSubmit={handleFormSubmit}
            isGrossMode={isGrossMode}
            onModeChange={handleModeChange}
            initialValues={initialFormValues}
            locale={locale}
            messages={salaryFormMessages}
            generalMessages={generalMessages}
          />
        </div>
        <div>
          <ResultCard result={calculationResult} locale={locale} messages={resultCardMessages} />
        </div>
      </div>

      <Card className="mt-12">
        <CardContent className="p-6">
          <Tabs defaultValue="explanation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="explanation">{calculatorTabsMessages.explanation}</TabsTrigger>
              <TabsTrigger value="law">{calculatorTabsMessages.law}</TabsTrigger>
              <TabsTrigger value="disclaimer">{calculatorTabsMessages.disclaimer}</TabsTrigger>
            </TabsList>
            <TabsContent value="explanation">
              <Card>
                <CardHeader><CardTitle>{getMsg(messages, "calculatorTabs.explanationContent.title", "Giải thích cách tính lương")}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.intro", "") }} />
                  <ul>
                    <li dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.item1", "") }} />
                    <li dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.item2", "") }} />
                    <li dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.item3", "") }} />
                    <li dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.item4", "") }} />
                    <li dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.item5", "") }} />
                  </ul>
                  <p dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.explanationContent.netToGross", "") }} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="law">
              <Card>
                <CardHeader><CardTitle>{legalBasisMessages.title}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="section-1-legal-basis">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">{legalBasisMessages.section1Title}</AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <p className="prose prose-sm max-w-none mb-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.section1Intro }} />
                        <Accordion type="multiple" className="w-full">
                          {/* PIT Law */}
                          <AccordionItem value="law-pit">
                            <AccordionTrigger>{legalBasisMessages.lawPitTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawPitDetail1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawPitDetail2 }} />
                                <li><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawPitSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawPitSource}</a></li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Social Insurance Law */}
                          <AccordionItem value="law-si">
                            <AccordionTrigger>{legalBasisMessages.lawSiTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                               <ul>
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawSiDetail1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawSiDetail2 }} />
                                <li><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawSiSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawSiSource}</a></li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Health Insurance Law */}
                          <AccordionItem value="law-hi">
                            <AccordionTrigger>{legalBasisMessages.lawHiTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawHiDetail1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawHiDetail2 }} />
                                <li><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawHiSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawHiSource}</a></li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Employment Law (UI) */}
                           <AccordionItem value="law-ui">
                            <AccordionTrigger>{legalBasisMessages.lawUiTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawUiDetail1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawUiDetail2 }} />
                                <li><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawUiSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawUiSource}</a></li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Regional Minimum Wage */}
                          <AccordionItem value="law-min-wage">
                            <AccordionTrigger>{legalBasisMessages.lawMinWageTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawMinWageDetail1 }} />
                              <ul className="list-disc ml-5">
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawMinWageItem1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawMinWageItem2 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawMinWageItem3 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawMinWageItem4 }} />
                              </ul>
                              <p><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawMinWageSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawMinWageSource}</a></p>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Base Salary */}
                          <AccordionItem value="law-base-salary">
                            <AccordionTrigger>{legalBasisMessages.lawBaseSalaryTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawBaseSalaryDetail1 }} />
                              <p><strong>{legalBasisMessages.sourceReferenceLabel}:</strong> <a href={legalBasisMessages.lawBaseSalarySourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawBaseSalarySource}</a></p>
                            </AccordionContent>
                          </AccordionItem>
                           {/* Related Decrees */}
                          <AccordionItem value="law-related-decrees">
                            <AccordionTrigger>{legalBasisMessages.lawRelatedDecreesTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul className="list-disc ml-5">
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawRelatedDecreesItem1 }} />
                                <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.lawRelatedDecreesItem2 }} />
                                <li><strong>{legalBasisMessages.sourceReferenceLabel}:</strong>
                                  <a href={legalBasisMessages.lawRelatedDecreesSource1Link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center ml-1"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawRelatedDecreesSource1Label}</a>,
                                  <a href={legalBasisMessages.lawRelatedDecreesSource2Link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center ml-1"><Link2 size={14} className="mr-1" />{legalBasisMessages.lawRelatedDecreesSource2Label}</a>
                                </li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Section 2: How to Calculate */}
                    <AccordionItem value="section-2-calculation-method">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">{legalBasisMessages.section2Title}</AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pt-2">
                        <h4 dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_1Title }} />
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_1_p1 }} />
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_1_p2 }} />
                        <pre><code dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_1_formula }} /></pre>

                        <h4 dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_2Title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_2_item1 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_2_item2 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_2_item3 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_2_note }} />
                        </ul>

                        <h4 dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3Title }} />
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p1 }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p2_item1 }} />
                        </ul>
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p3_title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p3_item1 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p3_item2 }} />
                        </ul>
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_3_p4_title }} />
                        <div className="overflow-x-auto">
                          <table className="w-full my-2 border-collapse border border-border">
                            <thead>
                              <tr>
                                <th className="border border-border p-2 text-left" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableCol1 }} />
                                <th className="border border-border p-2 text-left" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableCol2 }} />
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow1_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow1_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow2_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow2_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow3_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow3_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow4_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow4_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow5_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow5_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow6_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow6_2 }} />
                              </tr>
                              <tr>
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow7_1 }} />
                                <td className="border border-border p-2" dangerouslySetInnerHTML={{ __html: legalBasisMessages.taxTableRow7_2 }} />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <h4 dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4Title }} />
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_intro }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_intro_item1 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_intro_item2 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_intro_item3 }} />
                        </ul>
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step1Title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step1_item1 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step1_item2 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step1_item3 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step1_item4 }} />
                        </ul>
                         <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step2Title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step2_item1 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step2_item2 }} />
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step2_item3 }} />
                        </ul>
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step3Title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step3_item1 }} />
                        </ul>
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step4Title }} />
                        <ul>
                          <li dangerouslySetInnerHTML={{ __html: legalBasisMessages.section2_4_step4_item1 }} />
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Section 3: Notes */}
                     <AccordionItem value="section-3-notes">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">{legalBasisMessages.section3Title}</AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pt-2">
                        <p dangerouslySetInnerHTML={{ __html: legalBasisMessages.section3_item1 }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="disclaimer">
              <Card>
                <CardHeader><CardTitle>{getMsg(messages, "calculatorTabs.disclaimerContent.title", "Lưu ý quan trọng")}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.disclaimerContent.p1", "")}} />
                  <p dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.disclaimerContent.p2", "")}} />
                  <p dangerouslySetInnerHTML={{ __html: getMsg(messages, "calculatorTabs.disclaimerContent.p3", "")}} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    