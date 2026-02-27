import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { Recommendation } from './types';

export default function WarningsTab({ recs }: { recs: Recommendation | undefined }) {
  if (!recs?.cannibalization?.length) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        {recs ? 'No cannibalization issues found.' : 'Run "AI Analysis" to check for issues.'}
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Keyword Cannibalization</CardTitle>
        <CardDescription>Multiple pages competing for the same search query</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.cannibalization.map((c, i) => (
          <div key={i} className="border border-red-200 rounded-lg p-4 space-y-2">
            <p className="font-medium">"{c.query}"</p>
            <div className="space-y-1">
              {c.pages.map((p, j) => (
                <div key={j} className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate flex-1">• {p}</p>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => window.open(p, '_blank')}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm"><strong>Action:</strong> {c.action}</p>
            <p className="text-sm text-muted-foreground">{c.rationale}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
