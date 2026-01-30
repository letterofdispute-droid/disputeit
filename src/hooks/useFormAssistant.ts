import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISuggestion {
  fieldId: string;
  suggestion: string;
  strength?: number;
}

interface FormAssistantState {
  suggestions: Record<string, string>;
  isLoading: Record<string, boolean>;
  error: string | null;
}

interface FormAssistantRequest {
  fieldId: string;
  fieldLabel: string;
  fieldValue: string;
  category: string;
  templateTitle: string;
  allFieldValues?: Record<string, string>;
}

export function useFormAssistant() {
  const [state, setState] = useState<FormAssistantState>({
    suggestions: {},
    isLoading: {},
    error: null,
  });
  
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const requestSuggestion = useCallback(async ({
    fieldId,
    fieldLabel,
    fieldValue,
    category,
    templateTitle,
    allFieldValues,
  }: FormAssistantRequest) => {
    // Don't request if value is too short
    if (fieldValue.length < 15) {
      return;
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, [fieldId]: true },
      error: null,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('form-assistant', {
        body: {
          action: 'suggest',
          fieldId,
          fieldLabel,
          fieldValue,
          category,
          templateTitle,
          context: allFieldValues,
        },
      });

      if (error) throw error;

      if (data?.suggestion) {
        setState(prev => ({
          ...prev,
          suggestions: { ...prev.suggestions, [fieldId]: data.suggestion },
          isLoading: { ...prev.isLoading, [fieldId]: false },
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: { ...prev.isLoading, [fieldId]: false },
        }));
      }
    } catch (err) {
      console.error('Form assistant error:', err);
      setState(prev => ({
        ...prev,
        isLoading: { ...prev.isLoading, [fieldId]: false },
        error: 'Unable to get AI suggestion',
      }));
    }
  }, []);

  // Debounced version - waits 500ms after typing stops
  const requestSuggestionDebounced = useCallback((request: FormAssistantRequest) => {
    const { fieldId } = request;
    
    // Clear existing timer for this field
    if (debounceTimers.current[fieldId]) {
      clearTimeout(debounceTimers.current[fieldId]);
    }

    // Set new timer
    debounceTimers.current[fieldId] = setTimeout(() => {
      requestSuggestion(request);
    }, 500);
  }, [requestSuggestion]);

  // Get overall letter analysis
  const analyzeLetter = useCallback(async ({
    category,
    templateTitle,
    allFieldValues,
  }: {
    category: string;
    templateTitle: string;
    allFieldValues: Record<string, string>;
  }) => {
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, _analysis: true },
      error: null,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('form-assistant', {
        body: {
          action: 'analyze',
          category,
          templateTitle,
          context: allFieldValues,
        },
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        isLoading: { ...prev.isLoading, _analysis: false },
      }));

      return data;
    } catch (err) {
      console.error('Letter analysis error:', err);
      setState(prev => ({
        ...prev,
        isLoading: { ...prev.isLoading, _analysis: false },
        error: 'Unable to analyze letter',
      }));
      return null;
    }
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setState({
      suggestions: {},
      isLoading: {},
      error: null,
    });
  }, []);

  // Clear a specific suggestion
  const clearSuggestion = useCallback((fieldId: string) => {
    setState(prev => {
      const { [fieldId]: _, ...restSuggestions } = prev.suggestions;
      return {
        ...prev,
        suggestions: restSuggestions,
      };
    });
  }, []);

  return {
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    error: state.error,
    requestSuggestion,
    requestSuggestionDebounced,
    analyzeLetter,
    clearSuggestions,
    clearSuggestion,
  };
}

export default useFormAssistant;
