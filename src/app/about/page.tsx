
import { redirect } from 'next/navigation';

export default function AboutRedirectPage() {
  const defaultLocale = 'vi'; // Hardcode the default locale
  redirect(`/${defaultLocale}/about`);
  // This component will not render anything as redirect() aborts rendering.
  // return null;
}
