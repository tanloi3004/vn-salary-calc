
import type { Metadata } from 'next';
import { use } from 'react';
import SiteHeader from '@/components/site-header';

import viMessages from '@/locales/vi.json';
import enMessages from '@/locales/en.json';

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const messages = locale === 'vi' ? viMessages : enMessages;
  const siteTitle = messages.siteHeader.title;
  const placeholderDomain = 'https://your-app-domain.com'; // Replace with your actual domain

  if (locale === 'vi') {
    const viSeoMessages = viMessages.seo;
    return {
      title: siteTitle,
      description: viSeoMessages.description,
      keywords: viSeoMessages.keywords,
      openGraph: {
        title: siteTitle,
        description: viSeoMessages.description,
        type: 'website',
        locale: 'vi_VN',
        url: `${placeholderDomain}/vi`,
        siteName: siteTitle,
        images: [
          {
            url: 'https://placehold.co/1200x630.png', // data-ai-hint: "salary calculator finance"
            width: 1200,
            height: 630,
            alt: `${siteTitle} - ${viSeoMessages.description}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: viSeoMessages.description,
        images: ['https://placehold.co/1200x630.png'], // data-ai-hint: "salary calculator finance"
      },
      alternates: {
        canonical: `${placeholderDomain}/${locale}`,
        languages: {
          'vi-VN': `${placeholderDomain}/vi`,
          'en-US': `${placeholderDomain}/en`,
        },
      },
    };
  } else { // For 'en' or other locales
    const enSeoMessages = enMessages.seo;
    return {
      title: siteTitle,
      description: enSeoMessages.description,
      keywords: enSeoMessages.keywords,
      openGraph: {
        title: siteTitle,
        description: enSeoMessages.description,
        type: 'website',
        locale: 'en_US',
        url: `${placeholderDomain}/${locale}`,
        siteName: siteTitle,
         images: [
          {
            url: 'https://placehold.co/1200x630.png', // data-ai-hint: "salary calculator finance"
            width: 1200,
            height: 630,
            alt: `${siteTitle} - ${enSeoMessages.description}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: enSeoMessages.description,
        images: ['https://placehold.co/1200x630.png'], // data-ai-hint: "salary calculator finance"
      },
      alternates: {
        canonical: `${placeholderDomain}/${locale}`,
        languages: {
          'vi-VN': `${placeholderDomain}/vi`,
          'en-US': `${placeholderDomain}/en`,
        },
      },
    };
  }
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const unwrappedParams = use(params);
  const locale = unwrappedParams.locale;

  const messages = locale === 'vi' ? viMessages : enMessages;

  return (
    <>
      <SiteHeader locale={locale} messages={messages.siteHeader} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
