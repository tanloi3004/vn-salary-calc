
"use client";

import { useState, useEffect, use } from 'react'; // Added use
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ResultCard from '@/components/result-card';
import type { CalculationHistoryEntry, SalaryResult } from '@/types/salary';
import { LOCAL_STORAGE_HISTORY_KEY } from '@/lib/constants';
import { format } from 'date-fns'; // Consider using date-fns-tz for timezone specific formatting if needed
import { Eye, Trash2, History as HistoryIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import viMessagesJson from '@/locales/vi.json';
import enMessagesJson from '@/locales/en.json';

interface HistoryPageProps {
  params: {
    locale: string;
  };
}


const formatCurrencySimple = (value: number | undefined, currency: string = "VND", localeForFormatting: string = "vi") => {
  if (value === undefined || isNaN(value)) value = 0;
  const effectiveLocale = currency === "VND" ? (localeForFormatting === "vi" ? "vi-VN": "en-US") : (localeForFormatting === "vi" ? "vi-VN" : "en-US");

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: currency === "VND" ? 'decimal' : 'currency',
      currency: currency === "VND" ? undefined : currency,
      minimumFractionDigits: currency === "VND" ? 0 : 2,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(value);
  } catch (e) {
    return `${value.toLocaleString(effectiveLocale)} ${currency !== "VND" ? currency : ""}`;
  }
};


export default function HistoryPage({ params }: HistoryPageProps) { 
  const unwrappedParams = use(params as any); 
  const locale = unwrappedParams.locale; 

  const messagesAll = locale === 'vi' ? viMessagesJson : enMessagesJson;
  const messages = messagesAll.historyPage;
  const resultCardMessages = messagesAll.resultCard;


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
        title: messages.toastErrorLoadingHistory,
        description: messages.toastErrorLoadingHistoryDesc,
      });
    }
  }, [toast, messages]);

  const handleViewDetails = (entry: CalculationHistoryEntry) => {
    setSelectedResult(entry.fullResultSnapshot);
    setIsViewDetailsDialogOpen(true);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      setHistory([]);
      toast({
        title: messages.toastHistoryCleared,
        description: messages.toastHistoryClearedDesc,
      });
    } catch (error) {
      console.error("Failed to clear history from localStorage:", error);
      toast({
        variant: "destructive",
        title: messages.toastErrorClearingHistory,
        description: messages.toastErrorClearingHistoryDesc,
      });
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    try {
      const updatedHistory = history.filter(entry => entry.id !== entryId);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      toast({
        title: messages.toastEntryDeleted,
        description: messages.toastEntryDeletedDesc,
      });
    } catch (error) {
      console.error("Failed to delete entry from localStorage:", error);
      toast({
        variant: "destructive",
        title: messages.toastErrorDeletingEntry,
        description: messages.toastErrorDeletingEntryDesc,
      });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline text-primary flex items-center">
              <HistoryIcon size={32} className="mr-3" /> {messages.title}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              {messages.description}
            </CardDescription>
          </div>
          {history.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> {messages.clearAllButton}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{messages.confirmClearAllTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {messages.confirmClearAllDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{messages.cancelButton}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>{messages.continueDeleteButton}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">{messages.noHistory}</p>
              <p>{messages.noHistoryPrompt}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.tableHeaderTimestamp}</TableHead>
                  <TableHead>{messages.tableHeaderMode}</TableHead>
                  <TableHead>{messages.tableHeaderInputSalary}</TableHead>
                  <TableHead className="text-right">{messages.tableHeaderGrossVND}</TableHead>
                  <TableHead className="text-right">{messages.tableHeaderNetVND}</TableHead>
                  <TableHead className="text-center">{messages.tableHeaderActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{entry.mode === 'GrossToNet' ? (locale === 'vi' ? 'Gross → Net' : 'Gross → Net') : (locale === 'vi' ? 'Net → Gross' : 'Net → Gross')}</TableCell>
                    <TableCell>
                      {formatCurrencySimple(entry.inputSalary, entry.inputCurrency, locale)}
                      {entry.inputCurrency !== 'VND' ? ` ${entry.inputCurrency}` : ''}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencySimple(entry.calculatedGrossVND, "VND", locale)}</TableCell>
                    <TableCell className="text-right">{formatCurrencySimple(entry.calculatedNetVND, "VND", locale)}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(entry)} title={messages.viewDetailsTooltip}>
                        <Eye className="h-5 w-5 text-primary" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" title={messages.deleteEntryTooltip}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{messages.confirmDeleteEntryTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {messages.confirmDeleteEntryDescription.replace("{date}", format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm'))}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{messages.cancelButton}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>{messages.deleteButton}</AlertDialogAction>
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
              <DialogTitle>{messages.dialogTitle.replace("{date}", format(new Date(selectedResult.originalAmount && history.find(h => h.fullResultSnapshot === selectedResult)?.timestamp || Date.now()), 'dd/MM/yyyy HH:mm'))}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2">
              <ResultCard result={selectedResult} locale={locale} messages={resultCardMessages} />
            </div>
            <DialogFooter className="sm:justify-end bg-background py-3 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                    {messages.closeButton}
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
