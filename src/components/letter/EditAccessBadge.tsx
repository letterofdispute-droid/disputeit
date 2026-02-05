import { Clock, Lock, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface EditAccessBadgeProps {
  expiresAt: string | null;
  className?: string;
}

const EditAccessBadge = ({ expiresAt, className = '' }: EditAccessBadgeProps) => {
  const { status, daysRemaining, label } = useMemo(() => {
    if (!expiresAt) {
      return { status: 'locked', daysRemaining: 0, label: 'No edit access' };
    }

    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { status: 'expired', daysRemaining: 0, label: 'Editing locked' };
    }

    if (diffDays <= 3) {
      return { status: 'expiring', daysRemaining: diffDays, label: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining` };
    }

    return { status: 'active', daysRemaining: diffDays, label: `${diffDays} days remaining` };
  }, [expiresAt]);

  if (status === 'expired' || status === 'locked') {
    return (
      <Badge variant="destructive" className={className}>
        <Lock className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  }

  if (status === 'expiring') {
    return (
      <Badge variant="secondary" className={`bg-warning/20 text-warning-foreground border-warning/30 ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`bg-success/20 text-success border-success/30 ${className}`}>
      <Check className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

export default EditAccessBadge;
