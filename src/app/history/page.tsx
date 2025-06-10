
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ResultCard from '@/components/result-card';
import type { CalculationHistoryEntry, SalaryResult } from '@/types/salary';
import { LOCAL_STORAGE_HISTORY_KEY } from '@/lib/constants';
import { format } from 'date-fns';
import { Eye, Trash2, History as HistoryIcon, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// This formatCurrency function is a simplified version or could be imported if made common
// For now, let's define a local one for history page display to avoid import complexities from result-card.
// Ideally, this would be in a shared /lib/formatters.ts
const formatCurrencySimple = (value: number | undefined, currency: string = "VND") => {
  if (value === undefined || isNaN(value)) value = 0;
  try {
    return new Intl.NumberFormat(currency === "VND" ? 'vi-VN' : 'en-US', {
      style: currency === "VND" ? 'decimal' : 'currency',
      currency: currency === "VND" ? undefined : currency,
      minimumFractionDigits: currency === "VND" ? 0 : 2,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(value);
  } catch (e) {
    return `${value.toLocaleString(currency === "VND" ? 'vi-VN' : 'en-US')} ${currency !== "VND" ? currency : ""}`;
  }
};


export default function HistoryPage() {
  const [history, setHistory] = useState<CalculationHistoryEntry[]>([]);
  const [selectedResult, setSelectedResult] = useState<SalaryResult | null>(null);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Lỗi tải lịch sử",
        description: "Không thể tải lịch sử tính lương từ bộ nhớ cục bộ.",
      });
    }
  }, [toast]);

  const handleViewDetails = (entry: CalculationHistoryEntry) => {
    setSelectedResult(entry.fullResultSnapshot);
    setIsViewDetailsDialogOpen(true);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      setHistory([]);
      toast({
        title: "Đã xóa lịch sử",
        description: "Toàn bộ lịch sử tính lương đã được xóa.",
      });
    } catch (error) {
      console.error("Failed to clear history from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Lỗi xóa lịch sử",
        description: "Không thể xóa lịch sử tính lương.",
      });
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    try {
      const updatedHistory = history.filter(entry => entry.id !== entryId);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      toast({
        title: "Đã xóa mục",
        description: "Mục tính lương đã được xóa khỏi lịch sử.",
      });
    } catch (error) {
      console.error("Failed to delete entry from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Lỗi xóa mục",
        description: "Không thể xóa mục này.",
      });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline text-primary flex items-center">
              <HistoryIcon size={32} className="mr-3" /> Lịch sử tính lương
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              Xem lại các lần tính lương đã thực hiện. Dữ liệu được lưu trữ trên trình duyệt của bạn.
            </CardDescription>
          </div>
          {history.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa tất cả
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa toàn bộ lịch sử?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Tất cả các mục trong lịch sử tính lương sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>Tiếp tục xóa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">Chưa có lịch sử tính lương nào.</p>
              <p>Hãy thử tính lương và kết quả sẽ được lưu tại đây.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày giờ</TableHead>
                  <TableHead>Chế độ</TableHead>
                  <TableHead>Lương nhập vào</TableHead>
                  <TableHead className="text-right">Gross (VND)</TableHead>
                  <TableHead className="text-right">Net (VND)</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{entry.mode === 'GrossToNet' ? 'Gross → Net' : 'Net → Gross'}</TableCell>
                    <TableCell>
                      {formatCurrencySimple(entry.inputSalary, entry.inputCurrency)}
                      {entry.inputCurrency !== 'VND' ? ` ${entry.inputCurrency}` : ''}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencySimple(entry.calculatedGrossVND, "VND")}</TableCell>
                    <TableCell className="text-right">{formatCurrencySimple(entry.calculatedNetVND, "VND")}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(entry)} title="Xem chi tiết">
                        <Eye className="h-5 w-5 text-primary" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" title="Xóa mục này">
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa mục lịch sử này?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Mục tính lương ngày {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')} sẽ bị xóa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedResult && (
        <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
          <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Chi tiết tính lương ({format(new Date(selectedResult.originalAmount && history.find(h => h.fullResultSnapshot === selectedResult)?.timestamp || Date.now()), 'dd/MM/yyyy HH:mm')})</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2">
              <ResultCard result={selectedResult} />
            </div>
            <DialogFooter className="sm:justify-end mt-4 sticky bottom-0 bg-background py-3 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                    Đóng
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
