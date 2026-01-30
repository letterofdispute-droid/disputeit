import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  FileWarning
} from 'lucide-react';
import { LetterStrength } from '@/lib/fieldValidators';
import { cn } from '@/lib/utils';

interface LetterStrengthMeterProps {
  strength: LetterStrength;
  className?: string;
  showDetails?: boolean;
}

export function LetterStrengthMeter({ 
  strength, 
  className,
  showDetails = true 
}: LetterStrengthMeterProps) {
  const getStrengthColor = () => {
    switch (strength.level) {
      case 'strong':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'weak':
        return 'text-red-600';
    }
  };

  const getProgressColor = () => {
    switch (strength.level) {
      case 'strong':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'weak':
        return 'bg-red-500';
    }
  };

  const getStrengthLabel = () => {
    if (strength.overallScore >= 80) return 'Strong case';
    if (strength.overallScore >= 60) return 'Good foundation';
    if (strength.overallScore >= 40) return 'Needs improvement';
    return 'Just getting started';
  };

  const getStrengthIcon = () => {
    switch (strength.level) {
      case 'strong':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'moderate':
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'weak':
        return <FileWarning className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <Card className={cn("border-2", className, {
      'border-green-200 bg-green-50/50': strength.level === 'strong',
      'border-yellow-200 bg-yellow-50/50': strength.level === 'moderate',
      'border-red-200 bg-red-50/50': strength.level === 'weak',
    })}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-5 w-5", getStrengthColor())} />
            <span className="font-medium">Letter Strength</span>
          </div>
          <div className="flex items-center gap-2">
            {getStrengthIcon()}
            <span className={cn("font-semibold text-lg", getStrengthColor())}>
              {strength.overallScore}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div 
            className={cn("h-full transition-all duration-500 ease-out", getProgressColor())}
            style={{ width: `${strength.overallScore}%` }}
          />
        </div>

        {/* Status label */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn("text-sm font-medium", getStrengthColor())}>
            {getStrengthLabel()}
          </span>
          <span className="text-sm text-muted-foreground">
            {strength.completedFields} of {strength.totalRequired} required fields
          </span>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            {/* Critical missing fields */}
            {strength.criticalMissing.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">Missing critical information:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strength.criticalMissing.map((field, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {strength.suggestions.length > 0 && strength.criticalMissing.length === 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">To strengthen your letter:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {strength.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success message */}
            {strength.level === 'strong' && strength.criticalMissing.length === 0 && (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Your letter has strong supporting details!</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LetterStrengthMeter;
