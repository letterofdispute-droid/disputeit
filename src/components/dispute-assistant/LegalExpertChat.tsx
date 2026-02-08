import { useState, useCallback } from 'react';
import { Scale, ArrowLeft, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from './ChatInterface';
import ChatInput from './ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LegalExpertChatProps {
  initialContext?: {
    reason: string;
    suggestedApproach: string;
  };
  previousMessages?: Message[];
  onBack: () => void;
  onLetterGenerated: (letterContent: string) => void;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `I'm your Legal Correspondence Expert, specialized in US consumer protection law and formal dispute resolution.

Unlike generic AI assistants, I'm trained specifically on federal and state consumer statutes (FCRA, FDCPA, FTC Act, and more) and proper legal letter formatting.

Let me help you draft a custom letter. First, could you tell me more about your situation? What happened, and what outcome are you hoping to achieve?`,
};

const LegalExpertChat = ({ initialContext, previousMessages, onBack, onLetterGenerated }: LegalExpertChatProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (previousMessages && previousMessages.length > 0) {
      // Include context from previous conversation
      const contextMessage: Message = {
        role: 'assistant',
        content: `I understand that ${initialContext?.reason || 'your situation is unique'}. ${initialContext?.suggestedApproach || 'Let me help you draft a custom letter.'}

I'm now in Legal Correspondence Expert mode. I'll gather the specific details I need to draft a professional letter with proper legal citations.

What's the name of the company or person you're having the dispute with?`,
      };
      return [...previousMessages, contextMessage];
    }
    return [INITIAL_MESSAGE];
  });
  const [isLoading, setIsLoading] = useState(false);

  const parseCustomLetter = (content: string): string | null => {
    const match = content.match(/\[CUSTOM_LETTER\]([\s\S]*?)\[\/CUSTOM_LETTER\]/);
    return match ? match[1].trim() : null;
  };

  const cleanContentForDisplay = (content: string): string => {
    return content.replace(/\[CUSTOM_LETTER\][\s\S]*?\[\/CUSTOM_LETTER\]/g, '').trim();
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

      // Check for generated letter
      const letter = parseCustomLetter(assistantContent);
      if (letter) {
        onLetterGenerated(letter);
      }
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-expert-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messages.filter(m => m !== INITIAL_MESSAGE).concat(userMsg)
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
      console.error('Legal expert chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "I apologize, but I encountered an error. Please try again or contact support if the issue persists." 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, onLetterGenerated]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Legal Expert branding */}
      <div className="px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Legal Correspondence Expert</h3>
              <p className="text-xs text-muted-foreground">Specialized AI for Consumer Disputes</p>
            </div>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="flex items-center gap-4 mt-2 ml-11">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 text-primary" />
            <span>US Consumer Law</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 text-primary" />
            <span>Formal Legal Format</span>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <ChatInterface messages={messages} isLoading={isLoading} />

      {/* Input */}
      <div className="border-t border-border p-4">
        <ChatInput 
          onSend={streamChat} 
          isLoading={isLoading}
          placeholder="Describe your situation in detail..."
        />
      </div>
    </div>
  );
};

export default LegalExpertChat;
