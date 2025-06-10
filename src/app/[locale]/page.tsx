
"use client";

import { useState } from 'react';
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


export default function HomePage({ params: { locale } }: HomePageProps) {
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

  // Simplified legal basis for brevity in this example
  const legalBasisSection1Intro = legalBasisMessages.section1Intro;
  const lawPitTitle = legalBasisMessages.lawPitTitle;
  const lawPitDetail1 = legalBasisMessages.lawPitDetail1;
  const lawPitDetail2 = legalBasisMessages.lawPitDetail2;
  const lawPitSource = legalBasisMessages.lawPitSource;
  const lawBhxhTitle = legalBasisMessages.lawBhxhTitle;
  const lawBhxhDetail1 = legalBasisMessages.lawBhxhDetail1;


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
                <CardHeader><CardTitle>{getMsg(messages, "calculatorTabs.explanation", "Giải thích cách tính lương")}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  {/* This content should also be translated using keys from messages */}
                  <p>Công cụ này tính toán lương dựa trên các thông số bạn cung cấp, bao gồm:</p>
                  <ul>
                    <li><strong>Lương Gross:</strong> Tổng thu nhập trước khi trừ bảo hiểm và thuế.</li>
                    <li><strong>Bảo hiểm xã hội (BHXH), Bảo hiểm y tế (BHYT), Bảo hiểm thất nghiệp (BHTN):</strong> Được tính dựa trên mức lương đóng bảo hiểm và tỷ lệ quy định. Mức lương đóng BH có thể là lương gross hoặc mức tùy chọn (không thấp hơn lương tối thiểu vùng và không quá 20 lần lương cơ sở cho BHXH/BHYT, hoặc 20 lần lương tối thiểu vùng cho BHTN).</li>
                    <li><strong>Thuế thu nhập cá nhân (TNCN):</strong> Tính trên thu nhập chịu thuế (Lương Gross - Các khoản bảo hiểm - Giảm trừ gia cảnh). Áp dụng biểu thuế lũy tiến từng phần hoặc thuế suất cố định (tùy chọn).</li>
                    <li><strong>Giảm trừ gia cảnh:</strong> Bao gồm giảm trừ cho bản thân người nộp thuế và người phụ thuộc (nếu có).</li>
                    <li><strong>Lương Net:</strong> Là lương thực nhận sau khi đã trừ tất cả các khoản bảo hiểm và thuế TNCN.</li>
                  </ul>
                  <p>Khi tính từ <strong>Net sang Gross</strong>, công cụ sử dụng phương pháp tính toán lặp để tìm ra mức lương Gross tương ứng.</p>
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
                        <p className="prose prose-sm max-w-none mb-2" dangerouslySetInnerHTML={{ __html: legalBasisSection1Intro }} />
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value="law-tncn">
                            <AccordionTrigger>{lawPitTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li dangerouslySetInnerHTML={{ __html: lawPitDetail1 }} />
                                <li dangerouslySetInnerHTML={{ __html: lawPitDetail2 }} />
                                <li><strong>{locale === 'vi' ? 'Nguồn tham khảo' : 'Reference'}:</strong> <a href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-thue-thu-nhap-ca-nhan-2007-04-2007-QH12-50179.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />{lawPitSource}</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-bhxh">
                            <AccordionTrigger>{lawBhxhTitle}</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                               <ul>
                                <li dangerouslySetInnerHTML={{ __html: lawBhxhDetail1 }} />
                                {/* Add more translated details here */}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          {/* Add other laws here, translated */}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="section-2-calculation-method">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">{getMsg(messages, "legalBasis.section2Title", "2. Cách tính lương...")}</AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pt-2">
                        {/* Content for calculation method, needs translation */}
                        <p>...</p>
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="section-3-notes">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">{getMsg(messages, "legalBasis.section3Title", "3. Lưu ý")}</AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pt-2">
                         {/* Content for notes, needs translation */}
                        <p>...</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="disclaimer">
              <Card>
                <CardHeader><CardTitle>{getMsg(messages, "calculatorTabs.disclaimer", "Lưu ý quan trọng")}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                   {/* This content should also be translated using keys from messages */}
                  <p>Kết quả từ công cụ này chỉ mang tính chất tham khảo và ước tính. Các yếu tố thực tế tại doanh nghiệp của bạn (như phụ cấp, các khoản thưởng khác, chính sách công ty) có thể ảnh hưởng đến con số cuối cùng.</p>
                  <p>Chúng tôi cố gắng đảm bảo tính chính xác và cập nhật của thông tin, tuy nhiên không chịu trách nhiệm pháp lý cho bất kỳ sai sót nào.</p>
                  <p>Để có thông tin chính xác nhất, vui lòng tham khảo ý kiến của chuyên gia tư vấn thuế hoặc bộ phận nhân sự của bạn.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
