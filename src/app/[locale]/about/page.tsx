
import { use } from 'react'; // Added use
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";

import viMessages from '@/locales/vi.json';
import enMessages from '@/locales/en.json';

interface AboutPageProps {
  params: {
    locale: string;
  };
}

export default function AboutPage({ params }: AboutPageProps) { // Changed params destructuring
  const unwrappedParams = use(params); // Use React.use
  const locale = unwrappedParams.locale; // Get locale from unwrapped params

  const messages = locale === 'vi' ? viMessages.aboutPage : enMessages.aboutPage;

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
            <Info size={48} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">{messages.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            {messages.subTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base max-w-none text-foreground">
          <p dangerouslySetInnerHTML={{ __html: messages.intro }} />
          
          <h4>{messages.goalsTitle}</h4>
          <ul>
            <li>{messages.goal1}</li>
            <li>{messages.goal2}</li>
            <li>{messages.goal3}</li>
          </ul>

          <h4>{messages.featuresTitle}</h4>
          <ul>
            <li>{messages.feature1}</li>
            <li>{messages.feature2}</li>
            <li>{messages.feature3}</li>
            <li>{messages.feature4}</li>
            <li>{messages.feature5}</li>
          </ul>
          
          <h4>{messages.disclaimerTitle}</h4>
          <p>{messages.disclaimerText}</p>

          <h4>{messages.dataPrivacyTitle}</h4>
          <p>{messages.dataPrivacyText}</p>
          
          <p className="text-center mt-6 text-sm text-muted-foreground">
            {messages.poweredBy}
          </p>
          <p className="text-center mt-6" dangerouslySetInnerHTML={{ __html: messages.finalThanks }} />
        </CardContent>
      </Card>
    </div>
  );
}
