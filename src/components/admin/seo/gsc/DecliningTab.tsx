import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingDown, Plus, Loader2 } from 'lucide-react';
import { PositionBadge } from './GscBadges';
import { useGscActions } from './useGscActions';

export default function DecliningTab() {
  const { appliedActions, addToQueue } = useGscActions();

  const { data: declining, isLoading } = useQuery({
    queryKey: ['gsc-declining'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_declining_queries', { min_regression: 3 });
      if (error) throw error;
      return (data ?? []) as Array<{
        query: string; page: string; previous_position: number; current_position: number;
        position_delta: number; current_impressions: number; current_clicks: number;
      }>;
    },
  });

  if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading declining queries...</CardContent></Card>;

  if (!declining?.length) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No declining queries found (position regression &gt; 3 spots).</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" />Declining Queries</CardTitle>
        <CardDescription>{declining.length} queries losing ranking position</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Before</TableHead>
              <TableHead className="text-right">Now</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="hidden md:table-cell">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {declining.slice(0, 30).map((row, i) => {
              const queueKey = `declining-queue-${i}`;
              const suggestedAction = row.position_delta > 10 ? 'Update content' : row.current_position > 20 ? 'Add internal links' : 'Improve meta tags';
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium max-w-[250px] truncate">{row.query}</TableCell>
                  <TableCell className="text-right"><PositionBadge position={row.previous_position} /></TableCell>
                  <TableCell className="text-right"><PositionBadge position={row.current_position} /></TableCell>
                  <TableCell className="text-right text-red-500 font-medium">+{row.position_delta.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{row.current_impressions.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{suggestedAction}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                        onClick={() => addToQueue.mutate({
                          title: `Refresh: ${row.query}`,
                          articleType: 'how-to',
                          keyword: row.query,
                          actionKey: queueKey,
                        })}
                      >
                        {addToQueue.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : appliedActions.has(queueKey) ? '✓' : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
