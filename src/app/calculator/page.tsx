"use client";

import { useState } from 'react';
import SalaryForm from '@/components/salary-form';
import ResultCard from '@/components/result-card';
import type { SalaryInput, SalaryResult } from '@/types/salary';
import { computeSalary } from '@/lib/salary-calculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalculatorPage() {
  const [isGrossMode, setIsGrossMode] = useState<boolean>(true); // true for Gross to Net, false for Net to Gross
  const [calculationResult, setCalculationResult] = useState<SalaryResult | null>(null);
  const [formKey, setFormKey] = useState<number>(Date.now()); // Used to reset form state on mode change

  const handleFormSubmit = (data: SalaryInput) => {
    const result = computeSalary(data);
    setCalculationResult(result);
  };

  const handleModeChange = (newIsGrossMode: boolean) => {
    setIsGrossMode(newIsGrossMode);
    setCalculationResult(null); // Clear previous results when mode changes
    // Consider if form values should be reset or preserved. For now, resetting with key.
    setFormKey(Date.now()); 
  };
  
  // Prepare initial values for the form based on the current mode.
  // This is useful if we want to carry over the 'salaryInput' value when toggling modes,
  // but for a full form reset triggered by `formKey`, this might not be strictly necessary
  // unless we want to pre-fill differently based on mode.
  const initialFormValues = calculationResult 
    ? { salaryInput: isGrossMode ? calculationResult.gross : calculationResult.net, currency: calculationResult.currency } 
    : undefined;


  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="lg:sticky lg:top-8"> {/* Make form sticky on larger screens */}
           <SalaryForm
            key={formKey} // Re-mounts form on mode change to reset its internal state
            onSubmit={handleFormSubmit}
            isGrossMode={isGrossMode}
            onModeChange={handleModeChange}
            initialValues={initialFormValues} // Pass initial values if needed
          />
        </div>
        <div>
          <ResultCard result={calculationResult} />
        </div>
      </div>

      <Card className="mt-12">
        <CardContent className="p-6">
          <Tabs defaultValue="explanation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="explanation">Giải thích cách tính</TabsTrigger>
              <TabsTrigger value="law">Căn cứ pháp lý</TabsTrigger>
              <TabsTrigger value="disclaimer">Lưu ý</TabsTrigger>
            </TabsList>
            <TabsContent value="explanation">
              <Card>
                <CardHeader><CardTitle>Giải thích cách tính lương</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>Công cụ này tính toán lương dựa trên các thông số bạn cung cấp, bao gồm:</p>
                  <ul>
                    <li><strong>Lương Gross:</strong> Tổng thu nhập trước khi trừ bảo hiểm và thuế.</li>
                    <li><strong>Bảo hiểm xã hội (BHXH), Bảo hiểm y tế (BHYT), Bảo hiểm thất nghiệp (BHTN):</strong> Được tính dựa trên mức lương đóng bảo hiểm và tỷ lệ quy định. Mức lương đóng BH có thể là lương gross hoặc mức tùy chọn (không thấp hơn lương tối thiểu vùng và không quá 20 lần lương cơ sở).</li>
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
                <CardHeader><CardTitle>Căn cứ pháp lý</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>Các tính toán dựa trên các văn bản pháp luật hiện hành của Việt Nam, bao gồm (nhưng không giới hạn):</p>
                  <ul>
                    <li>Luật Thuế thu nhập cá nhân.</li>
                    <li>Luật Bảo hiểm xã hội.</li>
                    <li>Luật Bảo hiểm y tế.</li>
                    <li>Luật Việc làm (về Bảo hiểm thất nghiệp).</li>
                    <li>Các Nghị định, Thông tư hướng dẫn liên quan.</li>
                    <li>Quy định về lương tối thiểu vùng, lương cơ sở.</li>
                  </ul>
                  <p><em>Thông tin chỉ mang tính tham khảo và có thể cần cập nhật khi có thay đổi pháp luật.</em></p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="disclaimer">
              <Card>
                <CardHeader><CardTitle>Lưu ý quan trọng</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
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
