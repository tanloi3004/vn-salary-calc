import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to the default locale
  const defaultLocale = 'vi'; // Hardcode the default locale
  redirect(`/${defaultLocale}`);
  // This component will not render anything as redirect() aborts rendering.
  // return null;
}
