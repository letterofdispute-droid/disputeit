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
    <section className="relative overflow-hidden bg-primary py-24 md:py-32">
      {/* LCP Image - Optimized with fetchPriority */}
      <img
        src="/images/hero-bg.jpg"
        alt=""
        fetchPriority="high"
        decoding="async"
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover object-top opacity-30 grayscale"
      />

      {/* Gradient Overlay - Simpler two-tone */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/75 to-primary/90" />

      <div className="container-wide relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up">
            Professional Dispute Letters,{' '}
            <span className="text-accent">Without the Guesswork</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Pre-validated letter templates with controlled language, consistent structure, and legal precision. 
            No trial and error. Just predictable, professional results.
          </p>

          {/* AI Search Prompt */}
          <div className="animate-fade-up mb-8" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={handleAssistantOpen}
              className="w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 bg-primary-foreground/10 hover:bg-primary-foreground/15 border border-primary-foreground/20 rounded-xl text-left transition-all duration-300 group"
            >
              <Search className="h-5 w-5 text-primary-foreground/60 group-hover:text-accent transition-colors" />
              <span className="flex-1 text-primary-foreground/60 group-hover:text-primary-foreground/80 transition-colors">
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
            <Button variant="hero" size="xl" onClick={handleStartDisputeClick}>
              Start Your Dispute
              <ArrowRight className="h-5 w-5" />
            </Button>
            <button
              onClick={handleBrowseClick}
              className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors underline underline-offset-4"
            >
              or browse all letter templates
            </button>
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
