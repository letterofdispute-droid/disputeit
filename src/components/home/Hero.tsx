import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';
import { trackAIAssistantOpen, trackBrowseTemplatesClick, trackCTAClick } from '@/hooks/useGTM';

const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleStartDisputeClick = () => {
    trackCTAClick('start_your_dispute', 'hero');
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

  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Grid pattern background with warm gradient fade */}
      <div className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        {/* Warm gradient overlay fading from bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, hsl(var(--accent) / 0.12) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        {/* Top fade to white */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="container-wide relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement Pill */}
          <div className="animate-fade-up mb-8">
            <button
              onClick={handleBrowseClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm text-sm text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all duration-300 group"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              500+ templates available — Browse categories
              <ChevronRight className="h-3.5 w-3.5 text-accent group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-8 animate-fade-up" style={{ animationDelay: '0.08s' }}>
            Professional Dispute Letters,{' '}
            <span className="text-accent">Without the Guesswork</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.16s' }}>
            Pre-validated letter templates with controlled language, consistent structure, and legal precision. 
            No trial and error. Just predictable, professional results.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.24s' }}>
            <Button
              variant="hero"
              size="xl"
              onClick={handleStartDisputeClick}
              className="rounded-full shadow-[0_4px_24px_-4px_hsl(var(--accent)/0.45)]"
            >
              Start Your Dispute
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="rounded-full border-border hover:border-foreground/20"
              asChild
            >
              <Link to="/how-it-works">
                Learn More
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
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
