import { ArrowRight, Target, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-primary py-20 md:py-28">
      {/* Background Pattern */}
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
            <span>Pre-Validated Legal Templates</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up">
            Professional Dispute Letters,{' '}
            <span className="text-accent">Without the Guesswork</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Pre-validated templates with controlled language, consistent structure, and legal precision. 
            No trial and error. Just predictable, professional results.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/#letters">
                Create Your Letter
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/#how-it-works">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center gap-2 text-primary-foreground/70">
              <Target className="h-5 w-5 text-accent" />
              <span className="text-sm">Certainty, not guesswork</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-primary-foreground/70">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span className="text-sm">Pre-validated templates</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-primary-foreground/70">
              <Clock className="h-5 w-5 text-accent" />
              <span className="text-sm">Legal-safe language</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
