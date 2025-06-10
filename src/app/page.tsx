
"use client";

import { useState } from 'react';
import SalaryForm from '@/components/salary-form';
import ResultCard from '@/components/result-card';
import type { SalaryInput, SalaryResult } from '@/types/salary';
import { computeSalary } from '@/lib/salary-calculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
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
    setFormKey(Date.now());
  };

  const initialFormValues = calculationResult
    ? { salaryInput: isGrossMode ? calculationResult.gross : calculationResult.net, currency: calculationResult.currency }
    : undefined;

  const legalBasisHTML = `
    <p>&nbsp;</p>
    <h3><strong>1. Căn cứ pháp lý để tính lương</strong></h3>
    <p>Dưới đây là các văn bản pháp luật liên quan đến việc tính lương, bao gồm thuế thu nhập cá nhân, bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp, lương tối thiểu vùng và lương cơ sở:</p>
    <ul>
      <li>
        <strong>Luật Thuế thu nhập cá nhân</strong>:
        <ul>
          <li><strong>Luật số 04/2007/QH12</strong> (sửa đổi, bổ sung bởi <strong>Luật số 26/2012/QH13</strong> và <strong>Luật số 71/2014/QH13</strong>).</li>
          <li>Quy định về thu nhập chịu thuế, thu nhập miễn thuế, giảm trừ gia cảnh, và cách tính thuế thu nhập cá nhân (TNCN).</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-thue-thu-nhap-ca-nhan-2007-04-2007-QH12-50179.aspx" target="_blank" rel="noopener noreferrer">Luật Thuế TNCN - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Luật Bảo hiểm xã hội (BHXH)</strong>:
        <ul>
          <li><strong>Luật số 58/2014/QH13</strong>.</li>
          <li>Quy định mức đóng BHXH bắt buộc (8% từ người lao động, 17.5% từ người sử dụng lao động trên tiền lương làm căn cứ đóng BHXH).</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Bao-hiem/Luat-bao-hiem-xa-hoi-2014-58-2014-QH13-259328.aspx" target="_blank" rel="noopener noreferrer">Luật BHXH 2014 - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Luật Bảo hiểm y tế (BHYT)</strong>:
        <ul>
          <li><strong>Luật số 25/2008/QH12</strong> (sửa đổi, bổ sung bởi <strong>Luật số 46/2014/QH13</strong>).</li>
          <li>Quy định mức đóng BHYT bắt buộc (1.5% từ người lao động, 3% từ người sử dụng lao động).</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Bao-hiem/Luat-bao-hiem-y-te-2008-25-2008-QH12-66947.aspx" target="_blank" rel="noopener noreferrer">Luật BHYT - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Luật Việc làm (Bảo hiểm thất nghiệp - BHTN)</strong>:
        <ul>
          <li><strong>Luật số 38/2013/QH13</strong>.</li>
          <li>Quy định mức đóng BHTN (1% từ người lao động, 1% từ người sử dụng lao động).</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Luat-viec-lam-2013-38-2013-QH13-208163.aspx" target="_blank" rel="noopener noreferrer">Luật Việc làm - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Quy định về lương tối thiểu vùng</strong>:
        <ul>
          <li><strong>Nghị định 147/2024/NĐ-CP</strong> (hoặc văn bản mới nhất thay thế nếu có cập nhật sau ngày 10/6/2025) quy định mức lương tối thiểu vùng áp dụng từ 1/7/2024:
            <ul>
              <li>Vùng I: 5,220,000 VNĐ/tháng.</li>
              <li>Vùng II: 4,650,000 VNĐ/tháng.</li>
              <li>Vùng III: 4,080,000 VNĐ/tháng.</li>
              <li>Vùng IV: 3,650,000 VNĐ/tháng.</li>
            </ul>
          </li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-147-2024-ND-CP-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-606053.aspx" target="_blank" rel="noopener noreferrer">Nghị định 147/2024/NĐ-CP - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Quy định về lương cơ sở</strong>:
        <ul>
          <li><strong>Nghị định 73/2023/NĐ-CP</strong> (hoặc văn bản mới nhất thay thế nếu có cập nhật sau ngày 10/6/2025) quy định mức lương cơ sở là <strong>2,340,000 VNĐ/tháng</strong> (áp dụng từ 1/7/2023 cho khu vực công).</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-73-2023-ND-CP-muc-luong-co-so-doi-voi-can-bo-cong-chuc-vien-chuc-569278.aspx" target="_blank" rel="noopener noreferrer">Nghị định 73/2023/NĐ-CP - Thư viện Pháp luật</a>.</li>
        </ul>
      </li>
      <li>
        <strong>Các Nghị định, Thông tư hướng dẫn liên quan</strong>:
        <ul>
          <li><strong>Nghị định 38/2019/NĐ-CP</strong>: Quy định mức lương cơ sở và chế độ BHXH.</li>
          <li><strong>Thông tư 08/2013/TT-BNV</strong> và <strong>Thông tư 03/2021/TT-BNV</strong>: Hướng dẫn thực hiện chế độ lương, phụ cấp.</li>
          <li><strong>Nguồn tham khảo</strong>: <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Thong-tu-08-2013-TT-BNV-huong-dan-thuc-hien-che-do-luong-211335.aspx" target="_blank" rel="noopener noreferrer">Thông tư 08/2013/TT-BNV</a>, <a href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Thong-tu-03-2021-TT-BNV-huong-dan-thuc-hien-che-do-luong-469408.aspx" target="_blank" rel="noopener noreferrer">Thông tư 03/2021/TT-BNV</a>.</li>
        </ul>
      </li>
    </ul>
    <hr />
    <h3><strong>2. Cách tính lương theo quy định pháp luật</strong></h3>
    <p>Dựa trên các văn bản pháp lý trên, công thức tính lương cơ bản bao gồm các yếu tố sau:</p>
    <h4><strong>2.1. Lương gross và lương net</strong></h4>
    <ul>
      <li><strong>Lương gross</strong>: Là tổng thu nhập trước khi trừ các khoản bảo hiểm và thuế TNCN.</li>
      <li><strong>Lương net</strong>: Là số tiền thực nhận sau khi trừ các khoản BHXH, BHYT, BHTN và thuế TNCN (nếu có).</li>
      <li>Công thức:
        <pre><code>Lương net = Lương gross - (BHXH + BHYT + BHTN + Thuế TNCN)</code></pre>
      </li>
    </ul>
    <h4><strong>2.2. Các khoản đóng bảo hiểm bắt buộc</strong></h4>
    <ul>
      <li><strong>BHXH</strong>: 8% (người lao động) + 17.5% (người sử dụng lao động).</li>
      <li><strong>BHYT</strong>: 1.5% (người lao động) + 3% (người sử dụng lao động).</li>
      <li><strong>BHTN</strong>: 1% (người lao động) + 1% (người sử dụng lao động).</li>
      <li><strong>Lưu ý</strong>: Mức lương đóng BHXH, BHYT, BHTN tối đa bằng <strong>20 lần lương cơ sở</strong> (tức 2,340,000 × 20 = 46,800,000 VNĐ/tháng).</li>
    </ul>
    <h4><strong>2.3. Thuế thu nhập cá nhân (TNCN)</strong></h4>
    <ul>
      <li>Thuế TNCN được tính theo biểu thuế lũy tiến từng phần (theo <strong>Luật số 04/2007/QH12</strong>):
        <ul>
          <li>Thu nhập chịu thuế = Thu nhập tính thuế - Các khoản giảm trừ.</li>
          <li>Các khoản giảm trừ bao gồm:
            <ul>
              <li>Giảm trừ gia cảnh: 11 triệu VNĐ/tháng cho người nộp thuế + 4.4 triệu VNĐ/tháng cho mỗi người phụ thuộc.</li>
              <li>Các khoản đóng BHXH, BHYT, BHTN.</li>
            </ul>
          </li>
          <li>Biểu thuế lũy tiến:
            <table>
              <thead>
                <tr>
                  <th>Thu nhập chịu thuế/tháng (VNĐ)</th>
                  <th>Thuế suất</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Đến 5 triệu</td><td>5%</td></tr>
                <tr><td>Trên 5 triệu đến 10 triệu</td><td>10%</td></tr>
                <tr><td>Trên 10 triệu đến 18 triệu</td><td>15%</td></tr>
                <tr><td>Trên 18 triệu đến 32 triệu</td><td>20%</td></tr>
                <tr><td>Trên 32 triệu đến 52 triệu</td><td>25%</td></tr>
                <tr><td>Trên 52 triệu đến 80 triệu</td><td>30%</td></tr>
                <tr><td>Trên 80 triệu</td><td>35%</td></tr>
              </tbody>
            </table>
          </li>
        </ul>
      </li>
    </ul>
    <h4><strong>2.4. Ví dụ tính lương</strong></h4>
    <p>Giả sử:</p>
    <ul>
      <li>Lương gross: 20 triệu VNĐ/tháng.</li>
      <li>Người lao động có 1 người phụ thuộc.</li>
      <li>Vùng làm việc: Vùng I (lương tối thiểu 5,220,000 VNĐ).</li>
    </ul>
    <p><strong>Bước 1: Tính các khoản bảo hiểm</strong></p>
    <ul>
      <li>BHXH: 20,000,000 × 8% = 1,600,000 VNĐ.</li>
      <li>BHYT: 20,000,000 × 1.5% = 300,000 VNĐ.</li>
      <li>BHTN: 20,000,000 × 1% = 200,000 VNĐ.</li>
      <li>Tổng bảo hiểm: 1,600,000 + 300,000 + 200,000 = 2,100,000 VNĐ.</li>
    </ul>
    <p><strong>Bước 2: Tính thu nhập chịu thuế</strong></p>
    <ul>
      <li>Thu nhập tính thuế = 20,000,000 - 2,100,000 = 17,900,000 VNĐ.</li>
      <li>Giảm trừ gia cảnh: 11,000,000 (bản thân) + 4,400,000 (1 người phụ thuộc) = 15,400,000 VNĐ.</li>
      <li>Thu nhập chịu thuế = 17,900,000 - 15,400,000 = 2,500,000 VNĐ.</li>
    </ul>
    <p><strong>Bước 3: Tính thuế TNCN</strong></p>
    <ul>
      <li>Thuế TNCN = 2,500,000 × 5% = 125,000 VNĐ.</li>
    </ul>
    <p><strong>Bước 4: Tính lương net</strong></p>
    <ul>
      <li>Lương net = 20,000,000 - (2,100,000 + 125,000) = 17,775,000 VNĐ.</li>
    </ul>
    <hr />
    <h3><strong>3. Lưu ý</strong></h3>
    <ul>
      <li>Các mức lương tối thiểu vùng và lương cơ sở có thể được điều chỉnh hàng năm. Bạn nên kiểm tra văn bản pháp luật mới nhất (thông qua Thư viện Pháp luật hoặc Cổng thông tin Chính phủ) để đảm bảo tính chính xác.</li>
    </ul>
  `;


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
                <CardContent className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: legalBasisHTML }} />
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

    