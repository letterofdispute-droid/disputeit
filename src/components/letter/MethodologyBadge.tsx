import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Sparkles, 
  Scale, 
  CheckCircle2,
  BookOpen,
  Award
} from 'lucide-react';
import { getCategoryKnowledge, getCategoryRegulations } from '@/data/categoryKnowledge';
import { cn } from '@/lib/utils';

interface MethodologyBadgeProps {
  category: string;
  subcategory?: string;
  jurisdiction?: string;
  className?: string;
}

export function MethodologyBadge({
  category,
  subcategory,
  jurisdiction,
  className,
}: MethodologyBadgeProps) {
  const categoryKnowledge = getCategoryKnowledge(category);
  const regulations = getCategoryRegulations(category, subcategory, jurisdiction);
  
  const primaryRegulation = regulations[0]?.name || 'Consumer protection law';
  const regulatoryBody = categoryKnowledge?.regulatoryBodies?.[0]?.name;

  return (
    <Card className={cn("bg-muted/30 border-2 border-border shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-primary" />
          <h4 className="font-medium">How This Template Was Built</h4>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Based on <span className="text-foreground font-medium">{primaryRegulation}</span> requirements
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Validated against industry standards and best practices
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Enhanced with AI-powered field validation and suggestions
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Written by experts with formal letter structure
            </span>
          </div>
          
          {regulatoryBody && (
            <div className="flex items-start gap-2">
              <Award className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                Suitable for escalation to <span className="text-foreground font-medium">{regulatoryBody}</span>
              </span>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-muted">
          <Badge variant="outline" className="text-xs bg-background">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Enhanced
          </Badge>
          <Badge variant="outline" className="text-xs bg-background">
            <Shield className="h-3 w-3 mr-1" />
            Legal Framework
          </Badge>
          <Badge variant="outline" className="text-xs bg-background">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for inline use
export function AIEnhancedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", className)}>
      <Sparkles className="h-3 w-3 text-primary" />
      AI-Enhanced Template
    </Badge>
  );
}

export default MethodologyBadge;
