import { useState, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  autoStartListening?: boolean;
}

const ChatInput = ({ onSend, isLoading, placeholder = "Type or speak your dispute...", autoStartListening = false }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const { isListening, transcript, isSupported, toggle, setTranscript } = useSpeechRecognition();

  // Sync transcript into input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-start listening if requested
  useEffect(() => {
    if (autoStartListening && isSupported && !isListening) {
      toggle();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      setTranscript('');
      if (isListening) toggle();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
      />
      {isSupported && (
        <Button
          onClick={toggle}
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className={`flex-shrink-0 h-[44px] w-[44px] relative ${isListening ? 'animate-pulse-ring' : ''}`}
          title={isListening ? 'Stop listening' : 'Speak your dispute'}
          type="button"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}
      <Button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        size="icon"
        className="flex-shrink-0 h-[44px] w-[44px]"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatInput;
