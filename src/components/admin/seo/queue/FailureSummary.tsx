import { AlertCircle, CreditCard, Clock, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ContentQueueItem } from '@/hooks/useContentQueue';

interface FailureCategory {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  variant: 'destructive' | 'default';
}

function categorizeFailures(failedItems: ContentQueueItem[]): FailureCategory[] {
  let creditCount = 0;
  let rateLimitCount = 0;
  let aiErrorCount = 0;
  let otherCount = 0;

  for (const item of failedItems) {
    const msg = item.error_message || '';
    if (msg.startsWith('CREDIT_EXHAUSTED:')) creditCount++;
    else if (msg.startsWith('RATE_LIMITED:')) rateLimitCount++;
    else if (msg.startsWith('AI_ERROR:')) aiErrorCount++;
    else otherCount++;
  }

  const categories: FailureCategory[] = [];

  if (creditCount > 0) {
    categories.push({
      key: 'credits',
      icon: <CreditCard className="h-4 w-4" />,
      title: `AI Credits Exhausted (${creditCount} items)`,
      description: 'Your AI credit balance has run out. Add more credits in workspace settings, then retry the failed items.',
      count: creditCount,
      variant: 'destructive',
    });
  }

  if (rateLimitCount > 0) {
    categories.push({
      key: 'rate-limit',
      icon: <Clock className="h-4 w-4" />,
      title: `Rate Limited (${rateLimitCount} items)`,
      description: 'Too many requests in a short period. Wait a few minutes, then retry with a smaller batch size.',
      count: rateLimitCount,
      variant: 'default',
    });
  }

  if (aiErrorCount > 0) {
    categories.push({
      key: 'ai-error',
      icon: <ServerCrash className="h-4 w-4" />,
      title: `AI Service Error (${aiErrorCount} items)`,
      description: 'The AI service encountered a temporary issue. Please retry these items later.',
      count: aiErrorCount,
      variant: 'default',
    });
  }

  if (otherCount > 0) {
    categories.push({
      key: 'other',
      icon: <AlertCircle className="h-4 w-4" />,
      title: `Other Errors (${otherCount} items)`,
      description: 'These items failed for various reasons. Hover over individual items in the table to see details.',
      count: otherCount,
      variant: 'default',
    });
  }

  return categories;
}

interface FailureSummaryProps {
  failedItems: ContentQueueItem[];
}

export default function FailureSummary({ failedItems }: FailureSummaryProps) {
  if (failedItems.length === 0) return null;

  const categories = categorizeFailures(failedItems);

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <Alert key={cat.key} variant={cat.variant}>
          {cat.icon}
          <AlertTitle>{cat.title}</AlertTitle>
          <AlertDescription>{cat.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
