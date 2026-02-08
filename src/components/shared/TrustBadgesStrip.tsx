import { forwardRef } from 'react';
import { Lock, FileText, Scale, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const trustBadges = [
  { icon: Lock, label: 'Secure Payment' },
  { icon: FileText, label: '500+ Templates' },
  { icon: Scale, label: 'Cites US Federal Law' },
  { icon: Building2, label: 'Includes Escalation Guidance' },
  { icon: Zap, label: 'Instant Download' },
];

interface TrustBadgesStripProps {
  variant?: 'default' | 'compact' | 'footer';
  className?: string;
  badges?: Array<'secure' | 'templates' | 'federal' | 'escalation' | 'download'>;
}

const badgeKeyMap: Record<string, number> = {
  secure: 0,
  templates: 1,
  federal: 2,
  escalation: 3,
  download: 4,
};

const TrustBadgesStrip = forwardRef<HTMLDivElement, TrustBadgesStripProps>(
  ({ variant = 'default', className, badges }, ref) => {
    const displayBadges = badges 
      ? badges.map(key => trustBadges[badgeKeyMap[key]]) 
      : trustBadges;

    return (
      <div 
        ref={ref}
        className={cn(
          'flex flex-wrap justify-center gap-4',
          variant === 'compact' && 'gap-3 md:gap-6',
          variant === 'footer' && 'gap-4 md:gap-8',
          className
        )}
      >
        {displayBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div 
              key={badge.label}
              className={cn(
                'flex items-center gap-2',
                variant === 'compact' && 'gap-1.5',
              )}
            >
              <Icon 
                className={cn(
                  'text-primary flex-shrink-0',
                  variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                )} 
              />
              <span 
                className={cn(
                  'text-muted-foreground whitespace-nowrap',
                  variant === 'compact' ? 'text-xs' : 'text-sm',
                )}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
);

TrustBadgesStrip.displayName = 'TrustBadgesStrip';

export default TrustBadgesStrip;
