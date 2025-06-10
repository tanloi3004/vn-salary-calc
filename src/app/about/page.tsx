import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
            <Info size={48} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Về VN Salary Calc</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Công cụ tính lương Gross ↔ Net cho thị trường Việt Nam.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base max-w-none text-foreground">
          <p>
            <strong>VN Salary Calc</strong> là một ứng dụng web được thiết kế để giúp người lao động và nhà tuyển dụng tại Việt Nam
            dễ dàng tính toán và hiểu rõ các thành phần lương của mình, từ lương gộp (Gross) sang lương thực nhận (Net) và ngược lại.
          </p>
          
          <h4>Mục tiêu của chúng tôi:</h4>
          <ul>
            <li>Cung cấp một công cụ tính toán chính xác, dựa trên luật thuế và bảo hiểm hiện hành của Việt Nam.</li>
            <li>Mang lại trải nghiệm người dùng thân thiện, dễ sử dụng trên mọi thiết bị.</li>
            <li>Giúp người dùng hiểu rõ hơn về cách lương của họ được cấu thành và các khoản khấu trừ.</li>
          </ul>

          <h4>Các tính năng chính:</h4>
          <ul>
            <li>Tính lương từ Gross sang Net và từ Net sang Gross.</li>
            <li>Tùy chọn đa dạng: loại tiền tệ, tỷ giá, cơ sở đóng bảo hiểm, phương pháp tính thuế, vùng, số người phụ thuộc, quốc tịch.</li>
            <li>Hiển thị chi tiết các khoản khấu trừ: BHXH, BHYT, BHTN, Thuế TNCN.</li>
            <li>Sao chép kết quả nhanh chóng.</li>
          </ul>
          
          <h4>Tuyên bố miễn trừ trách nhiệm:</h4>
          <p>
            Mặc dù chúng tôi cố gắng hết sức để đảm bảo tính chính xác và cập nhật của thông tin và các phép tính,
            VN Salary Calc chỉ nên được sử dụng cho mục đích tham khảo. Các quy định về thuế và bảo hiểm có thể thay đổi,
            và các yếu tố cụ thể tại doanh nghiệp của bạn có thể ảnh hưởng đến con số cuối cùng.
            Để có thông tin chính xác nhất, vui lòng tham khảo ý kiến của chuyên gia tư vấn thuế hoặc bộ phận nhân sự.
          </p>
          <p className="text-center mt-6">
            <em>Cảm ơn bạn đã sử dụng VN Salary Calc!</em>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
