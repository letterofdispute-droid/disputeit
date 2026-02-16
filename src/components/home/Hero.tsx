import { useState } from 'react';
import { ArrowRight, Target, ShieldCheck, Clock, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';
import GlobalSearch from '@/components/search/GlobalSearch';
import { trackAIAssistantOpen, trackBrowseTemplatesClick, trackCTAClick } from '@/hooks/useGTM';

const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <section className="relative overflow-hidden bg-background py-24 md:py-32 lg:py-36">
      {/* Geometric Background Elements */}
      
      {/* Large accent circle - top right */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/[0.07] animate-float will-change-transform" />
      
      {/* Primary circle - bottom left */}
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full border-2 border-primary/[0.08] animate-float-delayed will-change-transform" />

      {/* Diagonal line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <line x1="60%" y1="0" x2="40%" y2="100%" stroke="hsl(var(--primary))" strokeOpacity="0.06" strokeWidth="1" />
        <line x1="65%" y1="0" x2="45%" y2="100%" stroke="hsl(var(--accent))" strokeOpacity="0.04" strokeWidth="1" />
      </svg>

      {/* Dotted grid - right side */}
      <svg className="absolute right-12 bottom-24 w-40 h-40 opacity-[0.06] hidden lg:block" viewBox="0 0 160 160">
        {Array.from({ length: 64 }).map((_, i) => (
          <circle key={i} cx={(i % 8) * 22 + 6} cy={Math.floor(i / 8) * 22 + 6} r="2" fill="hsl(var(--primary))" />
        ))}
      </svg>

      {/* Small floating accent dot */}
      <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-accent/20 animate-float hidden md:block" />
      <div className="absolute bottom-1/3 left-[15%] w-2 h-2 rounded-full bg-primary/15 animate-float-delayed hidden md:block" />

      <div className="container-wide relative">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.06] text-primary text-sm font-medium mb-6 animate-fade-in">
              <ShieldCheck className="h-4 w-4" />
              <span>Pre-Validated Letter Templates</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-foreground leading-[1.1] mb-6 animate-fade-up">
              Professional Dispute Letters,{' '}
              <span className="text-accent">Without the Guesswork</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Pre-validated letter templates with controlled language, consistent structure, and legal precision. 
              No trial and error. Just predictable, professional results.
            </p>

            {/* AI Search Prompt */}
            <div className="animate-fade-up pb-4" style={{ animationDelay: '0.15s' }}>
              <button
                onClick={handleAssistantOpen}
                className="w-full max-w-xl mx-auto lg:mx-0 flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/50 border border-border shadow-soft rounded-xl text-left transition-all duration-300 group mb-4">
                <Search className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="flex-1 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  Describe your dispute and I'll find the right letter...
                </span>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-accent rounded-lg text-accent-foreground text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Help
                </div>
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2 lg:ml-1">
                or search templates & articles manually
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="accent" size="xl" onClick={handleStartDisputeClick}>
                Start Your Dispute
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" onClick={handleBrowseClick}>
                Browse Letter Templates
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">Certainty, not guesswork</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">Pre-validated letters</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">Legal-safe language</span>
              </div>
            </div>
          </div>

          {/* Right Column - Geometric Composition (desktop only) */}
          <div className="hidden lg:flex items-center justify-center relative" aria-hidden="true">
            {/* Document shape composition */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Large rounded rect - document silhouette */}
              <div className="absolute inset-[10%] rounded-2xl border-2 border-primary/[0.1] bg-card/60 shadow-elevated animate-float will-change-transform" />
              
              {/* Overlapping smaller rect */}
              <div className="absolute top-[5%] right-[5%] w-[65%] h-[75%] rounded-2xl border-2 border-accent/[0.12] bg-accent/[0.03] animate-float-delayed will-change-transform" />
              
              {/* Horizontal lines suggesting text */}
              <div className="absolute top-[30%] left-[20%] right-[30%] space-y-3">
                <div className="h-2 bg-primary/[0.08] rounded-full" />
                <div className="h-2 bg-primary/[0.06] rounded-full w-[85%]" />
                <div className="h-2 bg-primary/[0.05] rounded-full w-[70%]" />
                <div className="h-2 bg-primary/[0.04] rounded-full w-[90%]" />
                <div className="h-2 bg-primary/[0.03] rounded-full w-[60%]" />
              </div>

              {/* Checkmark circle */}
              <div className="absolute bottom-[15%] right-[20%] w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center animate-float">
                <ShieldCheck className="h-8 w-8 text-accent/40" />
              </div>

              {/* Small accent diamond */}
              <div className="absolute top-[12%] left-[8%] w-8 h-8 bg-accent/10 rotate-45 rounded-sm animate-spin-slow will-change-transform" />

              {/* Circle accent */}
              <div className="absolute bottom-[8%] left-[15%] w-20 h-20 rounded-full border-2 border-primary/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <DisputeAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)} />

      {/* Global Search */}
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} triggerSource="hero" />
    </section>
  );
};

export default Hero;
