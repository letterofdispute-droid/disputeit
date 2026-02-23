import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HeartPulse } from 'lucide-react';

interface HealthRow {
  id: string;
  title: string;
  slug: string;
  category_slug: string;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  related_templates: string[] | null;
  middle_image_1_url: string | null;
  middle_image_2_url: string | null;
  content_length: number;
  published_at: string | null;
  inbound_count: number;
  outbound_count: number;
}

function calcScore(row: HealthRow): number {
  let score = 0;
  if (row.featured_image_url) score++;
  if (row.meta_title) score++;
  if (row.meta_description) score++;
  if (row.primary_keyword) score++;
  if (row.secondary_keywords?.length) score++;
  if (row.related_templates?.length) score++;
  if (row.inbound_count > 0) score++;
  if (row.outbound_count > 0) score++;
  if (row.content_length > 4000) score++; // ~1000 words
  if (row.middle_image_1_url || row.middle_image_2_url) score++;
  return score;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 8) return <Badge className="bg-green-500/10 text-green-700 border-green-200">{score}/10</Badge>;
  if (score >= 5) return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">{score}/10</Badge>;
  return <Badge className="bg-red-500/10 text-red-700 border-red-200">{score}/10</Badge>;
}

export default function ArticleHealthTable() {
  const [unhealthyOnly, setUnhealthyOnly] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['article-health-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_article_health_data');
      if (error) throw error;
      return (data ?? []) as unknown as HealthRow[];
    },
  });

  const scored = useMemo(() => {
    if (!articles) return [];
    return articles.map(a => ({ ...a, score: calcScore(a) }));
  }, [articles]);

  const filtered = useMemo(() => {
    let result = scored;
    if (unhealthyOnly) result = result.filter(a => a.score < 7);
    result.sort((a, b) => sortAsc ? a.score - b.score : b.score - a.score);
    return result;
  }, [scored, unhealthyOnly, sortAsc]);

  const avgScore = scored.length ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(1) : '—';
  const unhealthyCount = scored.filter(a => a.score < 7).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartPulse className="h-5 w-5 text-red-500" />
              Article Health Scores
            </CardTitle>
            <CardDescription>
              Avg: {avgScore}/10 · {unhealthyCount} unhealthy articles (score &lt; 7)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="unhealthy-filter" checked={unhealthyOnly} onCheckedChange={setUnhealthyOnly} />
            <Label htmlFor="unhealthy-filter" className="text-sm">Unhealthy only</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading health data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {unhealthyOnly ? 'All articles are healthy! 🎉' : 'No published articles found.'}
          </p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="w-20 cursor-pointer select-none" onClick={() => setSortAsc(!sortAsc)}>
                    Score {sortAsc ? '↑' : '↓'}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Missing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map(article => {
                  const missing: string[] = [];
                  if (!article.featured_image_url) missing.push('Image');
                  if (!article.meta_title) missing.push('Meta Title');
                  if (!article.meta_description) missing.push('Meta Desc');
                  if (!article.primary_keyword) missing.push('Keyword');
                  if (!article.secondary_keywords?.length) missing.push('2nd Keywords');
                  if (!article.related_templates?.length) missing.push('Templates');
                  if (article.inbound_count === 0) missing.push('Inbound Links');
                  if (article.outbound_count === 0) missing.push('Outbound Links');
                  if (article.content_length <= 4000) missing.push('Short Content');
                  if (!article.middle_image_1_url && !article.middle_image_2_url) missing.push('Mid Images');

                  return (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{article.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{article.category_slug}</p>
                        </div>
                      </TableCell>
                      <TableCell><ScoreBadge score={article.score} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {missing.map(m => (
                            <Badge key={m} variant="outline" className="text-xs text-destructive border-destructive/30">{m}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
