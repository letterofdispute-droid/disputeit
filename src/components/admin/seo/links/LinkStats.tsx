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
    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
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
        <Badge variant="outline" className="text-xs col-span-2 sm:col-span-1 w-fit">
          Rejected: {stats.rejected}
        </Badge>
      )}
    </div>
  );
}
