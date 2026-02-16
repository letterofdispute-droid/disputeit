import { useState } from 'react';
import { ArrowRight, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';
import { trackAIAssistantOpen, trackBrowseTemplatesClick, trackCTAClick } from '@/hooks/useGTM';

const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleAssistantOpen = () => {
    trackAIAssistantOpen();
    setIsAssistantOpen(true);
  };

  const handleBrowseClick = () => {
    trackBrowseTemplatesClick('hero');
    const lettersSection = document.getElementById('letters');
    if (lettersSection) {
      lettersSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#letters';
    }
  };

  const handleStartDisputeClick = () => {
    trackCTAClick('start_your_dispute', 'hero');
    handleAssistantOpen();
  };

  return (
    <section className="relative overflow-hidden bg-background py-28 md:py-36">
      {/* SVG Dot Grid - top left */}
      <svg
        className="absolute top-0 left-0 w-[500px] h-[500px] opacity-[0.04]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="hsl(var(--foreground))" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Abstract circles - bottom right */}
      <svg
        className="absolute -bottom-20 -right-20 w-[400px] h-[400px] opacity-[0.06]"
        aria-hidden="true"
        viewBox="0 0 400 400"
      >
        <circle cx="200" cy="200" r="180" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
        <circle cx="200" cy="200" r="130" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
        <circle cx="200" cy="200" r="80" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
      </svg>

      {/* Gradient orb behind text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-wide relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up">
            Professional Dispute Letters,{' '}
            <span className="text-accent">Without the Guesswork</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Pre-validated letter templates with controlled language, consistent structure, and legal precision. 
            No trial and error. Just predictable, professional results.
          </p>

          {/* AI Search Prompt - Glass style */}
          <div className="animate-fade-up mb-8" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={handleAssistantOpen}
              className="glass w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-all duration-300 group"
            >
              <Search className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="flex-1 text-muted-foreground group-hover:text-foreground transition-colors">
                Describe your dispute and I'll find the right letter...
              </span>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-accent rounded-lg text-accent-foreground text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                AI Help
              </div>
            </button>
          </div>

          {/* CTA + Browse link */}
          <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" onClick={handleStartDisputeClick} className="shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.4)]">
              Start Your Dispute
              <ArrowRight className="h-5 w-5" />
            </Button>
            <button
              onClick={handleBrowseClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              or browse all letter templates
            </button>
          </div>

          {/* Minimal trust strip */}
          <div className="flex items-center justify-center gap-3 mt-16 animate-fade-up text-xs text-muted-foreground" style={{ animationDelay: '0.3s' }}>
            <span>500+ Templates</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Cites US Federal Law</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Instant Download</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <DisputeAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </section>
  );
};

export default Hero;
