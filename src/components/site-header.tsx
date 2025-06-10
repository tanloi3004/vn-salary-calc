import Link from 'next/link';
import { NotebookPen, Settings, Info, LayoutDashboard } from 'lucide-react'; // Using NotebookPen for app icon
import { Button } from '@/components/ui/button';

export default function SiteHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <NotebookPen size={28} />
          <h1 className="text-xl font-headline font-bold">VN Salary Calc</h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Settings size={18} />
              Calculator
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/about" className="flex items-center gap-1">
              <Info size={18} />
              About
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
