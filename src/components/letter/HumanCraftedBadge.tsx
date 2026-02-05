import { Users, Sparkles } from 'lucide-react';

const HumanCraftedBadge = () => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
        <Users className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Crafted by legal writing experts
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI assists, humans ensure quality
        </p>
      </div>
    </div>
  );
};

export default HumanCraftedBadge;
