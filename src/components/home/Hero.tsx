import { useState } from 'react';
import { ArrowRight, Target, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

import { trackAIAssistantOpen, trackBrowseTemplatesClick } from '@/hooks/useGTM';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [autoStartVoice, setAutoStartVoice] = useState(false);

  // Live platform-wide success rate from tracked disputes
  const { data: successStats } = useQuery({
    queryKey: ['dispute-success-rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispute_outcomes')
        .select('status');
      if (error) throw error;
      const total = data.length;
      const resolved = data.filter(d => d.status === 'resolved').length;
      const rate = total >= 10 ? Math.round((resolved / total) * 100) : null;
      return { total, resolved, rate };
    },
    staleTime: 1000 * 60 * 10,
  });

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

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32 lg:py-36">
      {/* Geometric Background Elements */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/[0.07] animate-float will-change-transform" />
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full border-2 border-primary/[0.08] animate-float-delayed will-change-transform" />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <line x1="60%" y1="0" x2="40%" y2="100%" stroke="hsl(var(--primary))" strokeOpacity="0.06" strokeWidth="1" />
        <line x1="65%" y1="0" x2="45%" y2="100%" stroke="hsl(var(--accent))" strokeOpacity="0.04" strokeWidth="1" />
      </svg>

      <svg className="absolute right-12 bottom-24 w-40 h-40 opacity-[0.06] hidden lg:block" viewBox="0 0 160 160">
        {Array.from({ length: 64 }).map((_, i) => (
          <circle key={i} cx={(i % 8) * 22 + 6} cy={Math.floor(i / 8) * 22 + 6} r="2" fill="hsl(var(--primary))" />
        ))}
      </svg>

      <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-accent/20 animate-float hidden md:block" />
      <div className="absolute bottom-1/3 left-[15%] w-2 h-2 rounded-full bg-primary/15 animate-float-delayed hidden md:block" />

      <div className="container-wide relative">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.06] text-primary text-sm font-medium mb-6 animate-fade-in">
              <ShieldCheck className="h-4 w-4" />
              <span>Your Step-by-Step Dispute System</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-foreground leading-[1.1] mb-6 animate-fade-up">
              Resolve Your Dispute{' '}
              <span className="text-accent">Step-by-Step</span>
              , Without a Lawyer
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Describe your situation. Get the right letter, the fastest resolution path, and every agency complaint link - all in one place.
            </p>

            {/* Single CTA */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="accent" size="xl" onClick={handleAssistantOpen} className="w-full sm:w-auto">
                Start Your Dispute
                <ArrowRight className="h-5 w-5" />
              </Button>
              <button
                onClick={handleBrowseClick}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-1 sm:mt-3"
              >
                or browse 550+ letter templates
              </button>
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
              {/* Verifiable platform stat */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-success" />
                <span className="text-sm font-semibold text-success whitespace-nowrap">
                  {successStats?.rate != null
                    ? `${successStats.rate}% of tracked disputes resolved`
                    : '550+ professional letter templates'}
                </span>
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

              {/* Small accent diamond — static on mobile, subtle rotate on desktop */}
              <div className="absolute top-[12%] left-[8%] w-8 h-8 bg-accent/10 rotate-45 rounded-sm hidden sm:block" />

              {/* Circle accent */}
              <div className="absolute bottom-[8%] left-[15%] w-20 h-20 rounded-full border-2 border-primary/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <DisputeAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => { setIsAssistantOpen(false); setAutoStartVoice(false); }}
        autoStartListening={autoStartVoice} />



    </section>
  );
};

export default Hero;
