import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EvidenceRequirement, getRequiredEvidence } from '@/data/categoryKnowledge';
import { cn } from '@/lib/utils';

interface EvidenceChecklistProps {
  category: string;
  subcategory?: string;
  checkedItems: Record<string, boolean>;
  onItemToggle: (item: string) => void;
  className?: string;
}

export function EvidenceChecklist({
  category,
  subcategory,
  checkedItems,
  onItemToggle,
  className,
}: EvidenceChecklistProps) {
  const evidence = getRequiredEvidence(category, subcategory);
  
  if (evidence.length === 0) {
    return null;
  }

  const essentialItems = evidence.filter(e => e.importance === 'essential');
  const recommendedItems = evidence.filter(e => e.importance === 'recommended');
  const helpfulItems = evidence.filter(e => e.importance === 'helpful');

  const essentialChecked = essentialItems.filter(e => checkedItems[e.item]).length;
  const allEssentialChecked = essentialChecked === essentialItems.length;

  const renderEvidence = (items: EvidenceRequirement[], label: string, labelClass: string) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium uppercase tracking-wider", labelClass)}>
            {label}
          </span>
          {label === 'Essential' && (
            <Badge variant={allEssentialChecked ? "default" : "secondary"} className="text-xs">
              {essentialChecked}/{essentialItems.length}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.item}
              className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`evidence-${item.item}`}
                checked={checkedItems[item.item] || false}
                onCheckedChange={() => onItemToggle(item.item)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`evidence-${item.item}`}
                  className={cn(
                    "text-sm cursor-pointer",
                    checkedItems[item.item] && "line-through text-muted-foreground"
                  )}
                >
                  {item.item}
                </label>
                {item.tip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex items-center gap-1 ml-2">
                          <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">{item.tip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Evidence Checklist
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gather these documents before submitting your letter
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderEvidence(essentialItems, 'Essential', 'text-red-600')}
        {renderEvidence(recommendedItems, 'Recommended', 'text-yellow-600')}
        {renderEvidence(helpfulItems, 'Helpful', 'text-blue-600')}

        {allEssentialChecked && essentialItems.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700 font-medium">
              ✓ You have all essential documents ready
            </p>
          </div>
        )}

        {!allEssentialChecked && essentialItems.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              Make sure you have essential documents before proceeding
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EvidenceChecklist;
