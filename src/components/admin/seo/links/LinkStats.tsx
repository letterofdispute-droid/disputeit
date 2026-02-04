import { Badge } from '@/components/ui/badge';

interface LinkStatsProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    applied: number;
  };
}

export default function LinkStats({ stats }: LinkStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm flex-wrap">
      <span className="text-muted-foreground">
        Pending: <strong>{stats.pending}</strong>
      </span>
      <span className="text-muted-foreground">
        Approved: <strong>{stats.approved}</strong>
      </span>
      <span className="text-muted-foreground">
        Applied: <strong>{stats.applied}</strong>
      </span>
      {stats.rejected > 0 && (
        <Badge variant="outline" className="text-xs">
          Rejected: {stats.rejected}
        </Badge>
      )}
    </div>
  );
}
