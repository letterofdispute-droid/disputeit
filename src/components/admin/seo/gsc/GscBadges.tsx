import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function PositionBadge({ position }: { position: number }) {
  if (position <= 3) return <Badge className="bg-green-500/10 text-green-700 border-green-200">{position.toFixed(1)}</Badge>;
  if (position <= 10) return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">{position.toFixed(1)}</Badge>;
  if (position <= 20) return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">{position.toFixed(1)}</Badge>;
  return <Badge variant="secondary">{position.toFixed(1)}</Badge>;
}

export function CtrIndicator({ ctr }: { ctr: number }) {
  const pct = (ctr * 100).toFixed(1);
  if (ctr >= 0.05) return <span className="text-green-600 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{pct}%</span>;
  if (ctr >= 0.02) return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" />{pct}%</span>;
  return <span className="text-red-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" />{pct}%</span>;
}
