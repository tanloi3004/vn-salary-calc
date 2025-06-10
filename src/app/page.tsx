import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
            <Calculator size={48} />
          </div>
          <CardTitle className="text-4xl font-headline font-bold text-primary">
            Chào mừng đến VN Salary Calc
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Công cụ tính lương Gross ↔ Net chính xác theo luật thuế và bảo hiểm Việt Nam.
            Dễ dàng, nhanh chóng và tiện lợi.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <p className="mb-8 text-foreground">
            Hãy bắt đầu tính toán mức lương của bạn ngay để hiểu rõ hơn về các khoản thu nhập và khấu trừ.
            Chúng tôi hỗ trợ chuyển đổi linh hoạt giữa lương Gross và Net, cùng nhiều tùy chọn cấu hình chi tiết.
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/calculator">
              <Calculator className="mr-2 h-5 w-5" />
              Đến trang tính lương
            </Link>
          </Button>
          <div className="mt-10 text-sm text-muted-foreground">
            <p>Luôn cập nhật theo quy định mới nhất.</p>
            <p>Thiết kế bởi chuyên gia, dành cho bạn.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
