import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import ChatInterface from './ChatInterface';
import ChatInput from './ChatInput';
import LetterRecommendation from './LetterRecommendation';
import CustomLetterOffer from './CustomLetterOffer';
import LegalExpertChat from './LegalExpertChat';
import DisputeIntakeFlow, { IntakeAnswers } from './DisputeIntakeFlow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Recommendation {
  category: string;
  letter: string;
  reason: string;
}

interface CustomLetterOfferData {
  reason: string;
  suggestedApproach: string;
}

interface DisputeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  startInLegalExpertMode?: boolean;
  autoStartListening?: boolean;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm here to help you resolve your dispute. Tell me what happened, and I'll find the right letter for you.",
};

const DisputeAssistantModal = ({ isOpen, onClose, startInLegalExpertMode = false, autoStartListening = false }: DisputeAssistantModalProps) => {
  const [showIntake, setShowIntake] = useState(true);
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeAnswers | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [customLetterOffer, setCustomLetterOffer] = useState<CustomLetterOfferData | null>(null);
  const [showLegalExpert, setShowLegalExpert] = useState(startInLegalExpertMode);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [pendingAutoTrigger, setPendingAutoTrigger] = useState(false);

  // Auto-trigger AI after intake completes (no typing required)
  useEffect(() => {
    if (!pendingAutoTrigger) return;
    setPendingAutoTrigger(false);

    const intakeContext = sessionStorage.getItem('dispute_intake_context');
    if (!intakeContext) return;

    setIsLoading(true);
    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: cleanContentForDisplay(assistantContent) }
              : m
          );
        }
        return [...prev, { role: 'assistant', content: cleanContentForDisplay(assistantContent) }];
      });

      const rec = parseRecommendation(assistantContent);
      if (rec) setRecommendation(rec);

      const offer = parseCustomLetterOffer(assistantContent);
      if (offer) setCustomLetterOffer(offer);
    };

    const hiddenTrigger = { role: 'user' as const, content: intakeContext };

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispute-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: [hiddenTrigger] }),
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) updateAssistant(content);
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      })
      .catch((error) => {
        console.error('Auto-trigger chat error:', error);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "I'm sorry, I encountered an error. Please type your situation below and I'll help." },
        ]);
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoTrigger]);

  const parseRecommendation = (content: string): Recommendation | null => {
    const match = content.match(/\[RECOMMENDATION\]([\s\S]*?)\[\/RECOMMENDATION\]/);
    if (!match) return null;

    const block = match[1];
    const categoryMatch = block.match(/category:\s*([^\n]+)/);
    const letterMatch = block.match(/letter:\s*([^\n]+)/);
    const reasonMatch = block.match(/reason:\s*([^\n]+)/);

    if (categoryMatch && letterMatch && reasonMatch) {
      return {
        category: categoryMatch[1].trim(),
        letter: letterMatch[1].trim(),
        reason: reasonMatch[1].trim(),
      };
    }
    return null;
  };

  const parseCustomLetterOffer = (content: string): CustomLetterOfferData | null => {
    const match = content.match(/\[CUSTOM_LETTER_OFFER\]([\s\S]*?)\[\/CUSTOM_LETTER_OFFER\]/);
    if (!match) return null;

    const block = match[1];
    const reasonMatch = block.match(/reason:\s*([^\n]+)/);
    const approachMatch = block.match(/suggested_approach:\s*([^\n]+)/);

    if (reasonMatch && approachMatch) {
      return {
        reason: reasonMatch[1].trim(),
        suggestedApproach: approachMatch[1].trim(),
      };
    }
    return null;
  };

  const cleanContentForDisplay = (content: string): string => {
    return content
      .replace(/\[RECOMMENDATION\][\s\S]*?\[\/RECOMMENDATION\]/g, '')
      .replace(/\[CUSTOM_LETTER_OFFER\][\s\S]*?\[\/CUSTOM_LETTER_OFFER\]/g, '')
      .trim();
  };

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: cleanContentForDisplay(assistantContent) } : m
          );
        }
        return [...prev, { role: 'assistant', content: cleanContentForDisplay(assistantContent) }];
      });

      // Check for recommendation
      const rec = parseRecommendation(assistantContent);
      if (rec) {
        setRecommendation(rec);
      }

      // Check for custom letter offer
      const offer = parseCustomLetterOffer(assistantContent);
      if (offer) {
        setCustomLetterOffer(offer);
      }
    };

    try {
      // Build message history, injecting intake context as a hidden system message before the first user turn
      const visibleMessages = messages.filter(m => m !== INITIAL_MESSAGE);
      const intakeContext = sessionStorage.getItem('dispute_intake_context');
      
      // Only prepend context on the very first user message (no prior user turns)
      const hasUserTurn = visibleMessages.some(m => m.role === 'user');
      const contextPrefix: Message[] = (!hasUserTurn && intakeContext)
        ? [{ role: 'user', content: intakeContext }, { role: 'assistant', content: 'Understood. I have your context.' }]
        : [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispute-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...contextPrefix, ...visibleMessages, userMsg],
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error. Please try again or browse our letter categories directly." 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleIntakeComplete = (answers: IntakeAnswers) => {
    setIntakeAnswers(answers);
    setShowIntake(false);

    // Build a rich hidden context message to inject before the first user turn
    const typeLabel: Record<string, string> = {
      payment: 'a payment or charge dispute',
      product: 'a defective or missing product dispute',
      service: 'a poor service dispute',
      housing: 'a housing or rental dispute',
      employment: 'an employment dispute',
      travel: 'a travel dispute',
      financial: 'a financial or credit dispute',
      other: 'a general consumer dispute',
    };

    const creditCardNote = answers.paidByCreditCard === true
      ? 'The user paid by credit or debit card — a chargeback may be possible.'
      : answers.paidByCreditCard === false
      ? 'The user did NOT pay by credit card, so a chargeback is not available.'
      : 'Payment method is unknown.';

    const dateNote = answers.incidentDate
      ? (() => {
          const days = Math.floor((Date.now() - new Date(answers.incidentDate).getTime()) / (1000 * 60 * 60 * 24));
          const within60 = days <= 60;
          return `The incident happened on ${answers.incidentDate} (${days} days ago).${answers.paidByCreditCard && within60 ? ' They are WITHIN the 60-day chargeback window.' : answers.paidByCreditCard && !within60 ? ' The chargeback window has likely PASSED.' : ''}`;
        })()
      : 'Incident date is unknown.';

    const responseNote = answers.companyResponded === 'yes'
      ? 'The company has already responded but the user is unsatisfied — this is an escalation scenario.'
      : answers.companyResponded === 'no'
      ? 'The company has not responded to a previous contact — the user is being ignored.'
      : 'The user has NOT yet contacted the company — this is a first contact scenario.';

    const contextMessage = `[INTAKE CONTEXT - use this to personalise your response without asking these questions again]\nDispute category: ${typeLabel[answers.disputeType] || answers.disputeType}.\n${creditCardNote}\n${dateNote}\n${responseNote}\nBased on this context, provide a tailored recommendation. If a chargeback window is active, mention it as the fastest first step before the letter.`;

    // Build the AI welcome message shown to the user
    const chargebackHint = answers.paidByCreditCard === true
      ? " Since you paid by card, I'll also flag whether a chargeback is your fastest option."
      : '';
    const escalationHint = answers.companyResponded === 'no'
      ? " Since you've been ignored, I'll recommend a stronger escalation approach."
      : answers.companyResponded === 'yes'
      ? " Since they've already refused, I'll focus on formal escalation options."
      : '';

    const disputeLabel = typeLabel[answers.disputeType] || `a ${answers.disputeType} dispute`;

    setMessages([
      INITIAL_MESSAGE,
      {
        role: 'assistant',
        content: `Got it - you're dealing with ${disputeLabel}.${chargebackHint}${escalationHint}\n\nTell me the specifics of what happened and I'll find the right letter and resolution strategy for your situation.`,
      },
    ]);

    // Store context and auto-trigger AI immediately
    sessionStorage.setItem('dispute_intake_context', contextMessage);
    setPendingAutoTrigger(true);
  };

  const handleReset = () => {
    setShowIntake(true);
    setIntakeAnswers(null);
    setMessages([INITIAL_MESSAGE]);
    setRecommendation(null);
    setCustomLetterOffer(null);
    setShowLegalExpert(startInLegalExpertMode);
    setGeneratedLetter(null);
    setPendingAutoTrigger(false);
    sessionStorage.removeItem('dispute_intake_context');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleStartCustomLetter = () => {
    setShowLegalExpert(true);
  };

  const handleLetterGenerated = (letterContent: string) => {
    setGeneratedLetter(letterContent);
    // TODO: Open a purchase modal with the generated letter
    console.log('Custom letter generated:', letterContent);
  };

  const handleBackFromLegalExpert = () => {
    setShowLegalExpert(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] flex flex-col p-0 gap-0 [&>button]:hidden">
        {!showLegalExpert ? (
          <>
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <DialogTitle className="text-left font-serif">Dispute Assistant</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {showIntake ? 'Step-by-step dispute guidance' : "I'll help you find the right letter"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Intake flow shown first */}
            {showIntake ? (
              <DisputeIntakeFlow onComplete={handleIntakeComplete} />
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <ChatInterface messages={messages} isLoading={isLoading} />
                
                {/* Show recommendation if available */}
                {recommendation && (
                  <div className="px-4 py-3 border-t border-border bg-muted/30">
                    <LetterRecommendation 
                      recommendation={recommendation} 
                      onClose={handleClose}
                    />
                  </div>
                )}

                {/* Show custom letter offer if available (and no recommendation) */}
                {customLetterOffer && !recommendation && (
                  <div className="px-4 py-3 border-t border-border bg-muted/30">
                    <CustomLetterOffer 
                      reason={customLetterOffer.reason}
                      suggestedApproach={customLetterOffer.suggestedApproach}
                      onStartCustomLetter={handleStartCustomLetter}
                    />
                  </div>
                )}

                <div className="border-t border-border p-4 flex-shrink-0">
                  <ChatInput 
                    onSend={streamChat} 
                    isLoading={isLoading}
                    placeholder="Tell me what happened..."
                    autoStartListening={autoStartListening}
                  />
                  {messages.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleReset}
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Start over
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <LegalExpertChat 
            initialContext={customLetterOffer || undefined}
            previousMessages={messages.filter(m => m !== INITIAL_MESSAGE)}
            onBack={handleBackFromLegalExpert}
            onLetterGenerated={handleLetterGenerated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DisputeAssistantModal;

