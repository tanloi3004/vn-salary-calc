
"use client";

import Link from 'next/link';
import { NotebookPen, Settings, Info, History, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SiteHeaderProps {
  locale: string;
  messages: {
    title: string;
    calculator: string;
    history: string;
    about: string;
  };
}

export default function SiteHeader({ locale, messages }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: string) => {
    // Pathname for app router includes the current locale, e.g., /en/about
    // We need to remove it and then prepend the new locale.
    const pathParts = pathname.split('/');
    if (pathParts[1] === locale) {
      pathParts[1] = newLocale;
      router.push(pathParts.join('/'));
    } else {
      // Should not happen if routing is set up correctly, but as a fallback:
      router.push(`/${newLocale}${pathname}`);
    }
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/`} className="flex items-center gap-2">
          <NotebookPen size={28} />
          <h1 className="text-xl font-headline font-bold">{messages.title}</h1>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/`} className="flex items-center gap-1">
              <Settings size={18} />
              <span className="hidden sm:inline">{messages.calculator}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/history`} className="flex items-center gap-1">
              <History size={18} />
              <span className="hidden sm:inline">{messages.history}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/about`} className="flex items-center gap-1">
              <Info size={18} />
              <span className="hidden sm:inline">{messages.about}</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages size={18} />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => changeLocale('vi')}
                disabled={locale === 'vi'}
              >
                Tiếng Việt (VI)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLocale('en')}
                disabled={locale === 'en'}
              >
                English (EN)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
