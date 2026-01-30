import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Check, 
  AlertCircle, 
  Info, 
  Sparkles, 
  FileText, 
  Lightbulb,
  ChevronDown
} from 'lucide-react';
import { TemplateField } from '@/data/letterTemplates';
import { validateField, ValidationResult, assessFieldStrength, FieldStrength } from '@/lib/fieldValidators';
import { cn } from '@/lib/utils';

interface SmartFieldProps {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  aiSuggestion?: string;
  isValidating?: boolean;
  onRequestAiSuggestion?: (fieldId: string, value: string) => void;
}

export function SmartField({
  field,
  value,
  onChange,
  aiSuggestion,
  isValidating,
  onRequestAiSuggestion,
}: SmartFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [showEvidenceHint, setShowEvidenceHint] = useState(false);

  // Validation
  const validation = useMemo((): ValidationResult => {
    if (!field.validation || !hasBlurred) {
      return { isValid: true };
    }
    return validateField(value, field.validation);
  }, [value, field.validation, hasBlurred]);

  // Field strength
  const strength = useMemo((): FieldStrength => {
    return assessFieldStrength(value, field.type, field.required, field.impactLevel);
  }, [value, field.type, field.required, field.impactLevel]);

  // Status indicator
  const getStatusIcon = () => {
    if (isValidating) {
      return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
    }
    
    if (!validation.isValid) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    
    if (value && strength.level === 'strong') {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    
    if (value && strength.level === 'moderate') {
      return <Check className="h-4 w-4 text-yellow-600" />;
    }

    return null;
  };

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setHasBlurred(true);
    
    // Request AI suggestion for AI-enhanced fields after user finishes typing
    if (field.aiEnhanced && value.length > 10 && onRequestAiSuggestion) {
      onRequestAiSuggestion(field.id, value);
    }
  }, [field.aiEnhanced, field.id, value, onRequestAiSuggestion]);

  // Impact level styling
  const getImpactBadge = () => {
    if (field.impactLevel === 'critical') {
      return (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
          Critical
        </Badge>
      );
    }
    if (field.impactLevel === 'important') {
      return (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
          Important
        </Badge>
      );
    }
    return null;
  };

  // Common field wrapper
  const renderFieldContent = () => {
    const baseClasses = cn(
      "transition-all",
      !validation.isValid && "border-destructive focus-visible:ring-destructive",
      value && strength.level === 'strong' && validation.isValid && "border-green-500 focus-visible:ring-green-500",
      value && strength.level === 'moderate' && validation.isValid && "border-yellow-500 focus-visible:ring-yellow-500"
    );

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            className={cn(baseClasses, "min-h-[100px]")}
            required={field.required}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={baseClasses}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            className={baseClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {field.aiEnhanced && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 cursor-help">
                    <Sparkles className="h-3 w-3" />
                    AI-Assisted
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    This field uses AI to help you write more effective content
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {getImpactBadge()}
        </div>

        <div className="flex items-center gap-2">
          {/* Evidence hint button */}
          {field.evidenceHint && (
            <Popover open={showEvidenceHint} onOpenChange={setShowEvidenceHint}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>Evidence tip</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showEvidenceHint && "rotate-180")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" side="top">
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{field.evidenceHint}</p>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Status icon */}
          {getStatusIcon()}
        </div>
      </div>

      {/* Help text */}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {/* Format hint */}
      {field.formatHint && isFocused && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {field.formatHint}
        </p>
      )}

      {/* Field input */}
      <div className="relative">
        {renderFieldContent()}
      </div>

      {/* Validation error */}
      {!validation.isValid && hasBlurred && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{validation.message}</span>
          {validation.suggestion && (
            <span className="text-muted-foreground ml-1">({validation.suggestion})</span>
          )}
        </div>
      )}

      {/* Common mistakes warning */}
      {field.commonMistakes && isFocused && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
          <p className="font-medium mb-1">Common mistakes to avoid:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {field.commonMistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="text-xs bg-primary/5 border border-primary/20 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">AI Suggestion</span>
          </div>
          <p className="text-muted-foreground">{aiSuggestion}</p>
        </div>
      )}

      {/* Field strength feedback (for textarea only, when has content) */}
      {field.type === 'textarea' && value && hasBlurred && validation.isValid && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                strength.level === 'weak' && "bg-red-500 w-1/3",
                strength.level === 'moderate' && "bg-yellow-500 w-2/3",
                strength.level === 'strong' && "bg-green-500 w-full"
              )}
            />
          </div>
          <span className={cn(
            "text-muted-foreground",
            strength.level === 'weak' && "text-red-600",
            strength.level === 'moderate' && "text-yellow-600",
            strength.level === 'strong' && "text-green-600"
          )}>
            {strength.feedback}
          </span>
        </div>
      )}
    </div>
  );
}

export default SmartField;
