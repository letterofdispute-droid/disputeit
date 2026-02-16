import { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Shield, Sparkles, Scale, Users, CheckCircle2 } from 'lucide-react';

interface GeneratingOverlayProps {
  isOpen: boolean;
  isGenerating: boolean;
  onComplete: () => void;
}

const rotatingMessages = [
  {
    icon: Scale,
    title: "Analyzing your situation...",
    description: "Reviewing legal context and applicable regulations"
  },
  {
    icon: Shield,
    title: "Templates crafted by experts",
    description: "Our letters are built on proven consumer protection frameworks"
  },
  {
    icon: Users,
    title: "Thousands of disputes resolved",
    description: "Join consumers who've successfully advocated for their rights"
  },
  {
    icon: FileText,
    title: "Adding legal references...",
    description: "Including relevant citations for your jurisdiction"
  },
  {
    icon: Sparkles,
    title: "AI-enhanced, human-reviewed",
    description: "We use AI to personalize, but humans design every template"
  },
  {
    icon: CheckCircle2,
    title: "Structuring for impact",
    description: "Formatting your letter for maximum professional effectiveness"
  },
  {
    icon: Scale,
    title: "Expert methodology",
    description: "Thousands of hours of research inform our letter templates"
  },
  {
    icon: FileText,
    title: "Finalizing your document...",
    description: "Preparing your professionally formatted letter"
  },
];

const MINIMUM_DURATION_MS = 25000; // 25 seconds minimum
const MESSAGE_INTERVAL_MS = 3000; // Change message every 3 seconds

const GeneratingOverlay = ({ isOpen, isGenerating, onComplete }: GeneratingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const hasCompleted = useRef(false);

  // Handle progress animation - start when isOpen becomes true
  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setGenerationComplete(false);
    setTimerComplete(false);
    hasCompleted.current = false;

    // Animate progress bar over minimum duration
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / MINIMUM_DURATION_MS) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= MINIMUM_DURATION_MS) {
        setTimerComplete(true);
        clearInterval(progressInterval);
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isOpen]);

  // Handle message rotation
  useEffect(() => {
    if (!isOpen) return;

    setMessageIndex(0);
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % rotatingMessages.length);
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(messageInterval);
  }, [isOpen]);

  // Track when generation completes
  useEffect(() => {
    if (!isGenerating && progress > 0) {
      setGenerationComplete(true);
    }
  }, [isGenerating, progress]);

  // Call onComplete when both timer and generation are done — only once per cycle
  useEffect(() => {
    if (timerComplete && generationComplete && !hasCompleted.current) {
      hasCompleted.current = true;
      // Small delay for smooth transition
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [timerComplete, generationComplete, onComplete]);

  // Don't render if not open
  if (!isOpen) return null;

  const currentMessage = rotatingMessages[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-xl shadow-floating p-8 text-center">
        {/* Logo/Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
          Generating Your Letter
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          Please wait while we craft your professional letter
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm font-medium text-foreground">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Rotating Message */}
        <div className="min-h-[80px] flex flex-col items-center justify-center animate-fade-in" key={messageIndex}>
          <div className="p-3 bg-accent/10 rounded-full mb-3">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <p className="font-medium text-foreground text-sm">
            {currentMessage.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currentMessage.description}
          </p>
        </div>

        {/* Did you know section */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Did you know?</span> A well-structured
            dispute letter is 3x more likely to receive a response.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingOverlay;
