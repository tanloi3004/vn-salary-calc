import type { ReactNode } from 'react';
import './globals.css'; // Ensure globals.css is imported in the root layout
import { Toaster } from "@/components/ui/toaster";

// Root metadata can be minimal if [locale]/layout.tsx handles specifics
// export const metadata = {
//   title: "VN Salary Calc",
//   description: "Vietnam Gross to Net Salary Calculator",
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The `lang` attribute here is a default.
    // Next.js i18n routing and metadata in [locale] pages/layouts
    // will ensure the correct lang is set for localized pages.
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
