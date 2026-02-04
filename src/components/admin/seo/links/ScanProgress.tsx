import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface ScanProgressProps {
  message?: string;
}

export default function ScanProgress({ message = 'Scanning articles for linking opportunities...' }: ScanProgressProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">{message}</span>
        </div>
        <Progress value={undefined} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          This may take a few minutes depending on the number of articles.
        </p>
      </CardContent>
    </Card>
  );
}
