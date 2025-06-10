
import type { Metadata } from 'next';
// import '../globals.css'; // Moved to root src/app/layout.tsx
// import { Toaster } from "@/components/ui/toaster"; // Moved to root src/app/layout.tsx
import SiteHeader from '@/components/site-header';

import viMessages from '@/locales/vi.json';
import enMessages from '@/locales/en.json';

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const messages = locale === 'vi' ? viMessages : enMessages;
  return {
    title: messages.siteHeader.title,
    description: 'Vietnam Gross to Net Salary Calculator', // This could also be translated
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  const messages = locale === 'vi' ? viMessages : enMessages;

  // This component no longer renders <html>, <head>, or <body>.
  // It provides the content that goes *inside* the root layout's <body>.
  return (
    <>
      <SiteHeader locale={locale} messages={messages.siteHeader} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      {/* Toaster is now in the root layout src/app/layout.tsx */}
    </>
  );
}
