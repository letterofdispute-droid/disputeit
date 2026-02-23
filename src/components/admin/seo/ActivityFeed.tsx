import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, FileText, Globe, Link2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  icon: typeof KeyRound;
  description: string;
  timestamp: Date;
  color: string;
}

export default function ActivityFeed() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['seo-activity-feed'],
    queryFn: async () => {
      const results: ActivityEvent[] = [];

      // 1. Recent keyword imports (batch-level)
      const { data: keywords } = await supabase
        .from('keyword_targets')
        .select('batch_id, imported_at')
        .not('batch_id', 'is', null)
        .not('imported_at', 'is', null)
        .order('imported_at', { ascending: false })
        .limit(100);

      if (keywords?.length) {
        const batches = new Map<string, { count: number; at: string }>();
        keywords.forEach(k => {
          if (!k.batch_id || !k.imported_at) return;
          const existing = batches.get(k.batch_id);
          if (!existing || k.imported_at > existing.at) {
            batches.set(k.batch_id, { count: (existing?.count || 0) + 1, at: k.imported_at });
          } else {
            batches.set(k.batch_id, { ...existing, count: existing.count + 1 });
          }
        });
        Array.from(batches.entries()).slice(0, 3).forEach(([batchId, { count, at }]) => {
          results.push({
            id: `kw-${batchId}`,
            icon: KeyRound,
            description: `${count} keywords imported`,
            timestamp: new Date(at),
            color: 'text-purple-500',
          });
        });
      }

      // 2. Recently generated articles
      const { data: generated } = await supabase
        .from('content_queue')
        .select('id, generated_at')
        .eq('status', 'generated')
        .not('generated_at', 'is', null)
        .order('generated_at', { ascending: false })
        .limit(5);

      if (generated?.length) {
        results.push({
          id: `gen-${generated[0].id}`,
          icon: FileText,
          description: `${generated.length} articles generated`,
          timestamp: new Date(generated[0].generated_at!),
          color: 'text-blue-500',
        });
      }

      // 3. Recently published posts
      const { data: published } = await supabase
        .from('blog_posts')
        .select('id, published_at')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5);

      if (published?.length) {
        results.push({
          id: `pub-${published[0].id}`,
          icon: Globe,
          description: `${published.length} articles published recently`,
          timestamp: new Date(published[0].published_at!),
          color: 'text-green-500',
        });
      }

      // 4. Recently applied links
      const { data: links } = await supabase
        .from('link_suggestions')
        .select('id, applied_at')
        .eq('status', 'applied')
        .not('applied_at', 'is', null)
        .order('applied_at', { ascending: false })
        .limit(50);

      if (links?.length) {
        results.push({
          id: `link-${links[0].id}`,
          icon: Link2,
          description: `${links.length} internal links applied`,
          timestamp: new Date(links[0].applied_at!),
          color: 'text-amber-500',
        });
      }

      // 5. Recent auto-publish jobs
      const { data: publishJobs } = await supabase
        .from('daily_publish_jobs')
        .select('id, created_at, published_count, status')
        .order('created_at', { ascending: false })
        .limit(3);

      publishJobs?.forEach(j => {
        if (j.published_count > 0) {
          results.push({
            id: `autopub-${j.id}`,
            icon: Zap,
            description: `Auto-published ${j.published_count} articles`,
            timestamp: new Date(j.created_at),
            color: 'text-orange-500',
          });
        }
      });

      return results;
    },
    staleTime: 60_000,
  });

  const sortedEvents = useMemo(
    () => (events || []).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10),
    [events]
  );

  if (isLoading || sortedEvents.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {sortedEvents.map(event => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="flex items-center gap-1.5 text-sm">
                <Icon className={`h-3.5 w-3.5 ${event.color} shrink-0`} />
                <span>{event.description}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
