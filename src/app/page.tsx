
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


export default function HomePage() {
  const [isGrossMode, setIsGrossMode] = useState<boolean>(true);
  const [calculationResult, setCalculationResult] = useState<SalaryResult | null>(null);
  const [formKey, setFormKey] = useState<number>(Date.now());
  const { toast } = useToast();

  const handleFormSubmit = (data: SalaryInput) => {
    const result = computeSalary(data);
    setCalculationResult(result);

    // Save to localStorage
    const newHistoryEntry: CalculationHistoryEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15), // More unique ID
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
        title: "Đã lưu vào lịch sử",
        description: "Kết quả tính lương đã được lưu vào lịch sử trình duyệt.",
      });
    } catch (error) {
      console.error("Failed to save calculation history:", error);
      toast({
        variant: "destructive",
        title: "Lỗi lưu lịch sử",
        description: "Không thể lưu kết quả vào lịch sử. Bộ nhớ trình duyệt có thể đã đầy.",
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
              <TabsTrigger value="law">Căn cứ pháp lý & Cách tính</TabsTrigger>
              <TabsTrigger value="disclaimer">Lưu ý</TabsTrigger>
            </TabsList>
            <TabsContent value="explanation">
              <Card>
                <CardHeader><CardTitle>Giải thích cách tính lương</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none">
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
                <CardHeader><CardTitle>Căn cứ pháp lý và Hướng dẫn tính lương chi tiết</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="section-1-legal-basis">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">1. Căn cứ pháp lý để tính lương</AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <p className="prose prose-sm max-w-none mb-2">Dưới đây là các văn bản pháp luật liên quan đến việc tính lương, bao gồm thuế thu nhập cá nhân, bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp, lương tối thiểu vùng và lương cơ sở:</p>
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value="law-tncn">
                            <AccordionTrigger>Luật Thuế thu nhập cá nhân</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Luật số 04/2007/QH12</strong> (sửa đổi, bổ sung bởi <strong>Luật số 26/2012/QH13</strong> và <strong>Luật số 71/2014/QH13</strong>).</li>
                                <li>Quy định về thu nhập chịu thuế, thu nhập miễn thuế, giảm trừ gia cảnh, và cách tính thuế thu nhập cá nhân (TNCN).</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-thue-thu-nhap-ca-nhan-2007-04-2007-QH12-50179.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Luật Thuế TNCN - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-bhxh">
                            <AccordionTrigger>Luật Bảo hiểm xã hội (BHXH)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Luật số 58/2014/QH13</strong>.</li>
                                <li>Quy định mức đóng BHXH bắt buộc (8% từ người lao động, 17.5% từ người sử dụng lao động trên tiền lương làm căn cứ đóng BHXH).</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Bao-hiem/Luat-bao-hiem-xa-hoi-2014-58-2014-QH13-259328.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Luật BHXH 2014 - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-bhyt">
                            <AccordionTrigger>Luật Bảo hiểm y tế (BHYT)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Luật số 25/2008/QH12</strong> (sửa đổi, bổ sung bởi <strong>Luật số 46/2014/QH13</strong>).</li>
                                <li>Quy định mức đóng BHYT bắt buộc (1.5% từ người lao động, 3% từ người sử dụng lao động).</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Bao-hiem/Luat-bao-hiem-y-te-2008-25-2008-QH12-66947.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Luật BHYT - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-bhtn">
                            <AccordionTrigger>Luật Việc làm (Bảo hiểm thất nghiệp - BHTN)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                               <ul>
                                <li><strong>Luật số 38/2013/QH13</strong>.</li>
                                <li>Quy định mức đóng BHTN (1% từ người lao động, 1% từ người sử dụng lao động). Người nước ngoài không phải đóng BHTN.</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Luat-viec-lam-2013-38-2013-QH13-208163.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Luật Việc làm - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                           <AccordionItem value="law-trade-union">
                            <AccordionTrigger>Luật Công đoàn (Kinh phí công đoàn)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                               <ul>
                                <li><strong>Luật Công đoàn số 12/2012/QH13</strong>.</li>
                                <li>Quy định người sử dụng lao động đóng kinh phí công đoàn bằng 2% quỹ tiền lương làm căn cứ đóng BHXH cho người lao động.</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Luat-Cong-doan-2012-12-2012-QH13-138037.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Luật Công đoàn 2012 - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-min-wage">
                            <AccordionTrigger>Quy định về lương tối thiểu vùng</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Nghị định 147/2024/NĐ-CP</strong> quy định mức lương tối thiểu vùng áp dụng từ 1/7/2024:
                                  <ul>
                                    <li>Vùng I: 5,220,000 VNĐ/tháng.</li>
                                    <li>Vùng II: 4,650,000 VNĐ/tháng.</li>
                                    <li>Vùng III: 4,080,000 VNĐ/tháng.</li>
                                    <li>Vùng IV: 3,650,000 VNĐ/tháng.</li>
                                  </ul>
                                </li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-147-2024-ND-CP-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-606053.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Nghị định 147/2024/NĐ-CP - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-base-salary">
                            <AccordionTrigger>Quy định về lương cơ sở</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Nghị định 73/2023/NĐ-CP</strong> quy định mức lương cơ sở là <strong>2,340,000 VNĐ/tháng</strong> (áp dụng từ 1/7/2023 cho khu vực công).</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-73-2023-ND-CP-muc-luong-co-so-doi-voi-can-bo-cong-chuc-vien-chuc-569278.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Nghị định 73/2023/NĐ-CP - Thư viện Pháp luật</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="law-decrees">
                            <AccordionTrigger>Các Nghị định, Thông tư hướng dẫn liên quan</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Nghị định 38/2019/NĐ-CP</strong>: Quy định mức lương cơ sở và chế độ BHXH.</li>
                                <li><strong>Thông tư 08/2013/TT-BNV</strong> và <strong>Thông tư 03/2021/TT-BNV</strong>: Hướng dẫn thực hiện chế độ lương, phụ cấp.</li>
                                <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Thong-tu-08-2013-TT-BNV-huong-dan-thuc-hien-che-do-luong-211335.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Thông tư 08/2013/TT-BNV</a>, <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Thong-tu-03-2021-TT-BNV-huong-dan-thuc-hien-che-do-luong-469408.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline inline-flex items-center"><Link2 size={14} className="mr-1" />Thông tư 03/2021/TT-BNV</a>.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="section-2-calculation-method">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">2. Cách tính lương theo quy định pháp luật</AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <p className="prose prose-sm max-w-none mb-2">Dựa trên các văn bản pháp lý trên, công thức tính lương cơ bản bao gồm các yếu tố sau:</p>
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value="calc-gross-net">
                            <AccordionTrigger>2.1. Lương gross và lương net</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Lương gross</strong>: Là tổng thu nhập trước khi trừ các khoản bảo hiểm và thuế TNCN.</li>
                                <li><strong>Lương net</strong>: Là số tiền thực nhận sau khi trừ các khoản BHXH, BHYT, BHTN và thuế TNCN (nếu có).</li>
                                <li>Công thức:
                                  <pre className="bg-muted p-2 rounded-md my-2"><code>Lương net = Lương gross - (BHXH + BHYT + BHTN + Thuế TNCN)</code></pre>
                                </li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="calc-insurance">
                            <AccordionTrigger>2.2. Các khoản đóng bảo hiểm bắt buộc</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>BHXH</strong>: 8% (người lao động) + 17.5% (người sử dụng lao động).</li>
                                <li><strong>BHYT</strong>: 1.5% (người lao động) + 3% (người sử dụng lao động).</li>
                                <li><strong>BHTN</strong>: 1% (người lao động Việt Nam) + 1% (người sử dụng lao động). Người nước ngoài không đóng BHTN.</li>
                                <li><strong>Lưu ý</strong>:
                                    <ul>
                                        <li>Mức lương đóng BHXH, BHYT tối đa bằng <strong>20 lần lương cơ sở</strong> (hiện tại 2,340,000 × 20 = 46,800,000 VNĐ/tháng).</li>
                                        <li>Mức lương đóng BHTN tối đa bằng <strong>20 lần lương tối thiểu vùng</strong>.</li>
                                    </ul>
                                 </li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                           <AccordionItem value="calc-trade-union">
                            <AccordionTrigger>2.3. Kinh phí Công đoàn (NSDLĐ đóng)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li><strong>Kinh phí Công đoàn</strong>: 2% do người sử dụng lao động đóng (không trừ vào lương người lao động).</li>
                                <li>Mức lương làm căn cứ đóng tối đa bằng <strong>20 lần lương cơ sở</strong>.</li>
                                <li>Đây là khoản đóng bắt buộc đối với doanh nghiệp, không phụ thuộc vào việc người lao động có phải là đoàn viên công đoàn hay không (trừ một số trường hợp đặc thù).</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="calc-pit">
                            <AccordionTrigger>2.4. Thuế thu nhập cá nhân (TNCN)</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <ul>
                                <li>Thuế TNCN được tính theo biểu thuế lũy tiến từng phần:
                                  <ul>
                                    <li>Thu nhập tính thuế = Lương Gross - Các khoản bảo hiểm bắt buộc (BHXH, BHYT, BHTN do NLĐ đóng).</li>
                                    <li>Thu nhập chịu thuế = Thu nhập tính thuế - Các khoản giảm trừ gia cảnh.
                                      <ul>
                                        <li>Giảm trừ bản thân: 11 triệu VNĐ/tháng.</li>
                                        <li>Giảm trừ người phụ thuộc: 4.4 triệu VNĐ/tháng/người.</li>
                                      </ul>
                                    </li>
                                    <li>Biểu thuế lũy tiến:
                                      <div className="overflow-x-auto my-2">
                                        <table className="min-w-full">
                                          <thead>
                                            <tr>
                                              <th className="border px-2 py-1 text-left">Thu nhập chịu thuế/tháng (VNĐ)</th>
                                              <th className="border px-2 py-1 text-left">Thuế suất</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr><td className="border px-2 py-1">Đến 5 triệu</td><td className="border px-2 py-1">5%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 5 triệu đến 10 triệu</td><td className="border px-2 py-1">10%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 10 triệu đến 18 triệu</td><td className="border px-2 py-1">15%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 18 triệu đến 32 triệu</td><td className="border px-2 py-1">20%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 32 triệu đến 52 triệu</td><td className="border px-2 py-1">25%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 52 triệu đến 80 triệu</td><td className="border px-2 py-1">30%</td></tr>
                                            <tr><td className="border px-2 py-1">Trên 80 triệu</td><td className="border px-2 py-1">35%</td></tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </li>
                                  </ul>
                                </li>
                                <li>Đối với lao động không cư trú, thuế TNCN là 20% trên tổng thu nhập (không giảm trừ).</li>
                                <li>Tùy chọn thuế suất cố định 10% (nếu có trong form): Áp dụng cho một số trường hợp hợp đồng thời vụ, cộng tác viên,... trên thu nhập trước thuế (sau BH) và trước giảm trừ gia cảnh.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="calc-example">
                            <AccordionTrigger>2.5. Ví dụ tính lương</AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none pt-1 pl-4">
                              <p>Giả sử (lao động Việt Nam, đóng BH theo lương gross):</p>
                              <ul>
                                <li>Lương gross: 20 triệu VNĐ/tháng.</li>
                                <li>Người lao động có 1 người phụ thuộc.</li>
                                <li>Vùng làm việc: Vùng I (lương tối thiểu vùng 5,220,000 VNĐ; lương cơ sở 2,340,000 VNĐ).</li>
                              </ul>
                              <p><strong>Bước 1: Tính các khoản bảo hiểm người lao động đóng</strong></p>
                              <ul>
                                <li>Lương đóng BHXH, BHYT, BHTN: 20,000,000 VNĐ (vì &lt; 20 lần lương cơ sở và &lt; 20 lần LTT vùng).</li>
                                <li>BHXH (8%): 20,000,000 × 8% = 1,600,000 VNĐ.</li>
                                <li>BHYT (1.5%): 20,000,000 × 1.5% = 300,000 VNĐ.</li>
                                <li>BHTN (1%): 20,000,000 × 1% = 200,000 VNĐ.</li>
                                <li>Tổng bảo hiểm NLĐ đóng: 1,600,000 + 300,000 + 200,000 = 2,100,000 VNĐ.</li>
                              </ul>
                              <p><strong>Bước 2: Tính thu nhập chịu thuế TNCN</strong></p>
                              <ul>
                                <li>Thu nhập tính thuế (trước giảm trừ): 20,000,000 - 2,100,000 = 17,900,000 VNĐ.</li>
                                <li>Giảm trừ gia cảnh: 11,000,000 (bản thân) + 4,400,000 (1 người phụ thuộc) = 15,400,000 VNĐ.</li>
                                <li>Thu nhập chịu thuế (sau giảm trừ): 17,900,000 - 15,400,000 = 2,500,000 VNĐ.</li>
                              </ul>
                              <p><strong>Bước 3: Tính thuế TNCN (lũy tiến)</strong></p>
                              <ul>
                                <li>Bậc 1 (đến 5 triệu, thuế suất 5%): 2,500,000 × 5% = 125,000 VNĐ.</li>
                                <li>Tổng thuế TNCN: 125,000 VNĐ.</li>
                              </ul>
                              <p><strong>Bước 4: Tính lương net</strong></p>
                              <ul>
                                <li>Lương net = Lương Gross - Tổng BH NLĐ đóng - Thuế TNCN</li>
                                <li>Lương net = 20,000,000 - 2,100,000 - 125,000 = 17,775,000 VNĐ.</li>
                              </ul>
                               <p><strong>Bước 5: Tính các khoản người sử dụng lao động đóng</strong></p>
                              <ul>
                                <li>BHXH (17.5%): 20,000,000 × 17.5% = 3,500,000 VNĐ.</li>
                                <li>BHYT (3%): 20,000,000 × 3% = 600,000 VNĐ.</li>
                                <li>BHTN (1%): 20,000,000 × 1% = 200,000 VNĐ.</li>
                                <li>(Giả sử có đóng) Kinh phí công đoàn (2%): 20,000,000 × 2% = 400,000 VNĐ.</li>
                                <li>Tổng NSDLĐ đóng: 3,500,000 + 600,000 + 200,000 + 400,000 = 4,700,000 VNĐ.</li>
                              </ul>
                              <p><strong>Bước 6: Tổng chi phí của NSDLĐ</strong></p>
                              <ul>
                                <li>Tổng chi phí = Lương Gross + Tổng NSDLĐ đóng</li>
                                <li>Tổng chi phí = 20,000,000 + 4,700,000 = 24,700,000 VNĐ.</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="section-3-notes">
                      <AccordionTrigger className="text-xl font-semibold hover:no-underline">3. Lưu ý</AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pt-2">
                        <ul>
                          <li>Các mức lương tối thiểu vùng và lương cơ sở có thể được điều chỉnh hàng năm. Bạn nên kiểm tra văn bản pháp luật mới nhất (thông qua Thư viện Pháp luật hoặc Cổng thông tin Chính phủ) để đảm bảo tính chính xác.</li>
                          <li>Công cụ này cung cấp ước tính. Các khoản phụ cấp, thưởng, phúc lợi khác, hoặc các chính sách đặc thù của công ty có thể ảnh hưởng đến con số thực tế.</li>
                           <li>Luôn tham khảo ý kiến chuyên gia hoặc bộ phận nhân sự để có thông tin chính xác nhất cho trường hợp cụ thể của bạn.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
