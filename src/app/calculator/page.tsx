
import { redirect } from 'next/navigation';

export default function CalculatorRedirectPage() {
  const defaultLocale = 'vi'; // Hardcode the default locale
  // The main calculator functionality is at the root of the locale, e.g., /vi/
  redirect(`/${defaultLocale}/`);
  // This component will not render anything as redirect() aborts rendering.
  // return null;
}
