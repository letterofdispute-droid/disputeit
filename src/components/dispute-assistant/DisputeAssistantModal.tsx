import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import ChatInterface from './ChatInterface';
import ChatInput from './ChatInput';
import LetterRecommendation from './LetterRecommendation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Recommendation {
  category: string;
  letter: string;
  reason: string;
}

interface DisputeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm here to help you resolve your dispute. Tell me what happened, and I'll find the right letter for you.",
};

const DisputeAssistantModal = ({ isOpen, onClose }: DisputeAssistantModalProps) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

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

  const cleanContentForDisplay = (content: string): string => {
    return content.replace(/\[RECOMMENDATION\][\s\S]*?\[\/RECOMMENDATION\]/g, '').trim();
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
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispute-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages.filter(m => m !== INITIAL_MESSAGE), userMsg] 
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

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setRecommendation(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <DialogTitle className="text-left font-serif">Dispute Assistant</DialogTitle>
                <p className="text-sm text-muted-foreground">I'll help you find the right letter</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatInterface messages={messages} isLoading={isLoading} />
          
          {recommendation && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <LetterRecommendation 
                recommendation={recommendation} 
                onClose={handleClose}
              />
            </div>
          )}

          <div className="border-t border-border p-4 flex-shrink-0">
            <ChatInput 
              onSend={streamChat} 
              isLoading={isLoading}
              placeholder="Describe what happened..."
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
      </DialogContent>
    </Dialog>
  );
};

export default DisputeAssistantModal;
