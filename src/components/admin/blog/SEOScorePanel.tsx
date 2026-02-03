import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedContent } from '@/hooks/useGenerateBlogContent';

interface SEOScorePanelProps {
  content: GeneratedContent;
  keywords: string;
}

interface ScoreItem {
  label: string;
  status: 'good' | 'warning' | 'bad';
  message: string;
}

export function SEOScorePanel({ content, keywords }: SEOScorePanelProps) {
  const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const contentLower = content.content.toLowerCase();
  const titleLower = content.title.toLowerCase();

  // Calculate SEO metrics
  const titleLength = content.seo_title.length;
  const descLength = content.seo_description.length;
  
  // Check keyword presence in title
  const keywordInTitle = keywordList.some(kw => titleLower.includes(kw));
  
  // Check keyword density
  const wordCount = content.word_count;
  const keywordCount = keywordList.reduce((count, kw) => {
    const regex = new RegExp(kw, 'gi');
    return count + (contentLower.match(regex) || []).length;
  }, 0);
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Check for headings
  const hasH2 = content.content.includes('<h2');
  const hasH3 = content.content.includes('<h3');

  // Calculate score items
  const scoreItems: ScoreItem[] = [
    {
      label: 'SEO Title Length',
      status: titleLength >= 50 && titleLength <= 60 ? 'good' : titleLength < 40 || titleLength > 70 ? 'bad' : 'warning',
      message: `${titleLength} characters (ideal: 50-60)`,
    },
    {
      label: 'Meta Description',
      status: descLength >= 150 && descLength <= 160 ? 'good' : descLength < 120 || descLength > 170 ? 'bad' : 'warning',
      message: `${descLength} characters (ideal: 150-160)`,
    },
    {
      label: 'Keyword in Title',
      status: keywordInTitle ? 'good' : 'warning',
      message: keywordInTitle ? 'Primary keyword found in title' : 'Consider adding keyword to title',
    },
    {
      label: 'Keyword Density',
      status: keywordDensity >= 1 && keywordDensity <= 3 ? 'good' : keywordDensity < 0.5 || keywordDensity > 4 ? 'bad' : 'warning',
      message: `${keywordDensity.toFixed(1)}% (ideal: 1-3%)`,
    },
    {
      label: 'Content Length',
      status: wordCount >= 1000 ? 'good' : wordCount >= 500 ? 'warning' : 'bad',
      message: `${wordCount} words (1000+ recommended)`,
    },
    {
      label: 'Heading Structure',
      status: hasH2 && hasH3 ? 'good' : hasH2 ? 'warning' : 'bad',
      message: hasH2 && hasH3 ? 'Good hierarchy with H2 and H3' : hasH2 ? 'Has H2, consider adding H3' : 'Missing heading structure',
    },
  ];

  // Calculate overall score
  const goodCount = scoreItems.filter(i => i.status === 'good').length;
  const overallScore = Math.round((goodCount / scoreItems.length) * 100);

  const getStatusIcon = (status: ScoreItem['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'bad':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          SEO Score
          <span className={cn(
            "text-2xl font-bold",
            overallScore >= 80 ? "text-green-500" : overallScore >= 50 ? "text-yellow-500" : "text-red-500"
          )}>
            {overallScore}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress 
          value={overallScore} 
          className={cn(
            "h-2",
            overallScore >= 80 ? "[&>div]:bg-green-500" : overallScore >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
          )}
        />

        <div className="space-y-3">
          {scoreItems.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              {getStatusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
