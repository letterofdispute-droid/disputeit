import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ValidationResult } from '@/hooks/useGenerateBlogContent';

interface ContentValidationAlertProps {
  validation: ValidationResult;
}

export function ContentValidationAlert({ validation }: ContentValidationAlertProps) {
  if (validation.isClean) {
    return (
      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-400">Content Validated</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          No AI-typical phrases detected. Score: {validation.score}/100
        </AlertDescription>
      </Alert>
    );
  }

  const errorCount = validation.violations.filter(v => v.severity === 'error').length;
  const warningCount = validation.violations.filter(v => v.severity === 'warning').length;
  
  const isError = errorCount > 0 || validation.score < 50;

  return (
    <Alert variant={isError ? 'destructive' : 'default'} className={!isError ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
      {isError ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      )}
      <AlertTitle className={!isError ? 'text-yellow-800 dark:text-yellow-400' : ''}>
        AI Phrases Detected ({validation.violations.length})
      </AlertTitle>
      <AlertDescription>
        <div className={`mb-2 ${!isError ? 'text-yellow-700 dark:text-yellow-300' : ''}`}>
          Quality score: {validation.score}/100
          {warningCount > 0 && <span className="ml-2">• {warningCount} warning{warningCount !== 1 ? 's' : ''}</span>}
          {errorCount > 0 && <span className="ml-2">• {errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {validation.violations.map((v, i) => (
            <Badge
              key={i}
              variant={v.severity === 'error' ? 'destructive' : 'outline'}
              className={v.severity === 'warning' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400' : ''}
            >
              {v.phrase}
              {v.count > 1 && <span className="ml-1 opacity-70">×{v.count}</span>}
            </Badge>
          ))}
        </div>
        <p className="text-xs mt-2 opacity-70">
          Consider editing the content to remove these flagged phrases for a more natural tone.
        </p>
      </AlertDescription>
    </Alert>
  );
}
