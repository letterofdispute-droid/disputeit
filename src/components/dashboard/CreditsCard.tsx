import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Clock, ArrowRight } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';

const CreditsCard = () => {
  const { activeCredits, isLoading } = useUserCredits();

  if (isLoading || activeCredits.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Free Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {activeCredits.length}
              </p>
              <p className="text-sm text-muted-foreground">
                credit{activeCredits.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Credit expiration info */}
          <div className="space-y-2">
            {activeCredits.map((credit, index) => {
              const expiresAt = new Date(credit.expires_at);
              const daysLeft = differenceInDays(expiresAt, new Date());
              const isExpiringSoon = daysLeft <= 7;

              return (
                <div
                  key={credit.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Credit {index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className={isExpiringSoon ? 'text-warning font-medium' : ''}>
                      {daysLeft > 0
                        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                        : 'Expires today'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Use credits to generate letters for free. Each credit = 1 letter (PDF + Edit Access).
          </p>

          <Button variant="accent" className="w-full" asChild>
            <Link to="/templates">
              Use Credit
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreditsCard;
