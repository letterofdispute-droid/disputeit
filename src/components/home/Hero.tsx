import { useState } from 'react';
import { ArrowRight, Users, ShieldCheck, Clock, TrendingUp, FileText, MapPin, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';
import { Link } from 'react-router-dom';

import { trackAIAssistantOpen, trackBrowseTemplatesClick } from '@/hooks/useGTM';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_CHIPS = [
{ label: 'Refunds', href: '/letters/refunds' },
{ label: 'Housing', href: '/letters/housing' },
{ label: 'Insurance', href: '/letters/insurance' },
{ label: 'Contractors', href: '/letters/contractors' }];


const Hero = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [autoStartVoice, setAutoStartVoice] = useState(false);

  // Live platform-wide success rate from tracked disputes
  const { data: successStats } = useQuery({
    queryKey: ['dispute-success-rate'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('dispute_outcomes').
      select('status');
      if (error) throw error;
      const total = data.length;
      const resolved = data.filter((d) => d.status === 'resolved').length;
      const rate = total >= 10 ? Math.round(resolved / total * 100) : null;
      return { total, resolved, rate };
    },
    staleTime: 1000 * 60 * 10
  });

  // Total letters created
  const { data: letterCount } = useQuery({
    queryKey: ['total-letter-count'],
    queryFn: async () => {
      const { count, error } = await supabase.
      from('letter_purchases').
      select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 10
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

  const formattedLetterCount = letterCount && letterCount >= 100 ?
  `${Math.floor(letterCount / 1000)}K+` :
  '12,000+';

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32 lg:py-36">
      {/* Geometric Background Elements */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/[0.07] animate-float will-change-transform" />
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full border-2 border-primary/[0.08] animate-float-delayed will-change-transform" />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <line x1="60%" y1="0" x2="40%" y2="100%" stroke="hsl(var(--primary))" strokeOpacity="0.06" strokeWidth="1" />
        <line x1="65%" y1="0" x2="45%" y2="100%" stroke="hsl(var(--accent))" strokeOpacity="0.04" strokeWidth="1" />
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
              Don't Get Ignored.{' '}
              <span className="text-accent">Get Results.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Stop hitting a brick wall with landlords, insurers, and retailers. Our legally-vetted letter templates help you demand action and get the results you deserve; without the $300/hour lawyer.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="accent" size="xl" onClick={handleAssistantOpen} className="w-full sm:w-auto">
                Start Your Dispute
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={handleBrowseClick} className="w-full sm:w-auto">
                Browse 550+ Templates
              </Button>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-10 animate-fade-up" style={{ animationDelay: '0.25s' }}>
              {CATEGORY_CHIPS.map((chip) =>
              <Link key={chip.label} to={chip.href}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent/10 hover:text-accent transition-colors px-3 py-1 text-xs">
                    {chip.label}
                  </Badge>
                </Link>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">Used by 10,000+ consumers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">Pre-validated legal language</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm whitespace-nowrap">State-specific citations</span>
              </div>
              {/* Verifiable platform stat */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-success" />
                <span className="text-sm font-semibold text-success whitespace-nowrap">
                  {successStats?.rate != null ?
                  `${successStats.rate}% of tracked disputes resolved` :
                  '550+ professional letter templates'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Social Proof Card (desktop only) */}
          <div className="hidden lg:flex items-center justify-center relative animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Card className="w-full max-w-md p-8 shadow-elevated bg-card/95 backdrop-blur-sm border-border/60">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{formattedLetterCount}</p>
                  <p className="text-sm text-muted-foreground">Letters Created</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BadgeCheck className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {successStats?.rate != null ? `${successStats.rate}%` : '89%'}
                  </p>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border mb-6" />

              {/* Mini Testimonial */}
              <blockquote className="text-sm text-muted-foreground italic mb-6 text-center">
                "I sent my letter on Monday and had a full refund by Thursday. Wish I'd found this sooner."
              </blockquote>

              {/* Category Chips */}
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs">Refunds</Badge>
                <Badge variant="outline" className="text-xs">Housing</Badge>
                <Badge variant="outline" className="text-xs">Insurance</Badge>
                <Badge variant="outline" className="text-xs">Employment</Badge>
              </div>

              {/* Trusted line */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Trusted by thousands of consumers across all 50 states
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <DisputeAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => {setIsAssistantOpen(false);setAutoStartVoice(false);}}
        autoStartListening={autoStartVoice} />
    </section>);

};

export default Hero;