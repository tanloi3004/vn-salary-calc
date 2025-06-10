import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
            <Construction size={48} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Trang Dashboard</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Tính năng này đang được phát triển.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            Tại đây, bạn sẽ có thể xem lại lịch sử các lần tính lương đã lưu (yêu cầu đăng nhập).
            Vui lòng quay lại sau!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
