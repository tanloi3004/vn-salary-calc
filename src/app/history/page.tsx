
import { redirect } from 'next/navigation';

export default function HistoryRedirectPage() {
  const defaultLocale = 'vi'; // Hardcode the default locale
  redirect(`/${defaultLocale}/history`);
  // This component will not render anything as redirect() aborts rendering.
  // return null;
}
