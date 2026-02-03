import { useState } from 'react';
import { ArrowRight, Target, ShieldCheck, Clock, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleBrowseClick = () => {
    const lettersSection = document.getElementById('letters');
    if (lettersSection) {
      lettersSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#letters';
    }
  };

  return (
    <section className="relative overflow-hidden bg-primary py-20 md:py-28">
      {/* Background Image with Overlay */}
      {/* Background Image - Increased opacity */}
      <div 
        className="absolute inset-0 opacity-30 grayscale"
        style={{
          backgroundImage: `url('/images/hero-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      
      {/* Gradient Overlay - More transparent to show image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/85 to-primary/90" />

      {/* Background Pattern (subtle) */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-wide relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6 animate-fade-in">
            <ShieldCheck className="h-4 w-4" />
            <span>Pre-Validated Letter Templates</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up">
            Professional Dispute Letters,{' '}
            <span className="text-accent">Without the Guesswork</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Pre-validated letter templates with controlled language, consistent structure, and legal precision. 
            No trial and error. Just predictable, professional results.
          </p>

          {/* AI Search Prompt */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 bg-primary-foreground/10 hover:bg-primary-foreground/15 border border-primary-foreground/20 rounded-xl text-left transition-all duration-300 group mb-6"
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

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" onClick={() => setIsAssistantOpen(true)}>
              Start Your Dispute
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={handleBrowseClick}>
              Browse Letter Templates
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Target className="h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-sm whitespace-nowrap">Certainty, not guesswork</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-sm whitespace-nowrap">Pre-validated letters</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Clock className="h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-sm whitespace-nowrap">Legal-safe language</span>
            </div>
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
