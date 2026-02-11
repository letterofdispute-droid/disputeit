import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Shield, Users, Scale } from 'lucide-react';
import { useCategoryImage } from '@/hooks/useCategoryImage';

const values = [
  {
    icon: Target,
    title: 'Clarity',
    description: 'Every template is structured for maximum clarity and professionalism, helping you communicate effectively.',
  },
  {
    icon: Shield,
    title: 'Empowerment',
    description: 'We help consumers stand up for their rights with professional documentation and clear guidance.',
  },
  {
    icon: Users,
    title: 'Accessibility',
    description: 'Professional dispute resolution tools should be available to everyone, regardless of budget.',
  },
  {
    icon: Scale,
    title: 'Fairness',
    description: 'We believe in helping everyday people communicate more effectively with businesses and organizations.',
  },
];

const AboutPage = () => {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [missionImageLoaded, setMissionImageLoaded] = useState(false);

  // Fetch hero image
  const { largeUrl: heroImage } = useCategoryImage('about', 'professional team meeting office', 'about-hero');
  
  // Fetch mission section image
  const { largeUrl: missionImage } = useCategoryImage('about-mission', 'justice legal documents', 'about-mission');

  useEffect(() => {
    if (heroImage) {
      const img = new Image();
      img.onload = () => setHeroImageLoaded(true);
      img.src = heroImage;
    }
  }, [heroImage]);

  useEffect(() => {
    if (missionImage) {
      const img = new Image();
      img.onload = () => setMissionImageLoaded(true);
      img.src = missionImage;
    }
  }, [missionImage]);

  return (
    <Layout>
      <SEOHead 
        title="About Us | Letter of Dispute"
        description="Learn about Letter of Dispute - how a group of friends turned their frustration with consumer disputes into a mission to help others communicate effectively."
        canonicalPath="/about"
      />

      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Image */}
        {heroImage && (
          <div 
            className={`absolute inset-0 transition-opacity duration-700 ${heroImageLoaded ? 'opacity-20' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Helping Everyday People Resolve Disputes
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Letter of Dispute started when a group of friends kept running into the same 
              frustrating problem - and decided to do something about it.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  It started simply enough: a few friends kept running into the same frustrating problem - 
                  dealing with companies that wouldn't make things right. Whether it was a landlord ignoring 
                  repair requests, a refund that never came, or an insurance claim that got denied without 
                  explanation, the experience was always the same.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  After helping each other write effective complaint letters that actually got results, 
                  we realized others could benefit from the same approach. What began as helping friends 
                  has grown into a mission: give everyone access to clear, professional dispute resolution tools.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we use AI technology combined with editorial oversight to help you create 
                  well-structured letters for almost any consumer dispute. We're not lawyers, and we 
                  don't pretend to be - we're just people who believe that everyone deserves to be 
                  heard when something goes wrong.
                </p>
              </div>
            </div>
            
            {/* Mission Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              {missionImage ? (
                <img 
                  src={missionImage}
                  alt="Professional documents and communication"
                  className={`w-full h-80 object-cover transition-opacity duration-700 ${missionImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-80 bg-muted animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">What We Do</h2>
            <p className="text-muted-foreground">
              We provide AI-powered letter templates with editorial oversight - not legal advice.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">We Do</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      Provide professionally structured letter templates
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      Use AI to personalize letters to your situation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      Include educational information about consumer rights
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      Review templates for quality and consistency
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">We Don't</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✗</span>
                      Provide legal advice or legal representation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✗</span>
                      Guarantee any specific outcome or result
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✗</span>
                      Have attorneys review individual letters
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✗</span>
                      Have any affiliation with government agencies
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
            What We Believe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-muted/50">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-3">Important Notice</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Letter of Dispute is an independent, privately-owned service. We are not a law firm, 
                do not provide legal advice, and have no affiliation with any government agency 
                (including the FTC, CFPB, or any state attorney general). All letter templates are 
                AI-generated with editorial oversight and are provided "as is" for informational 
                purposes only. For legal matters, please consult a licensed attorney in your jurisdiction.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Author names appearing on our articles are editorial pen names (pseudonyms) used for creative purposes. 
                They do not represent real individuals, and no contributor is a legal professional. All author biographies 
                are fictional narratives inspired by common consumer experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
        
        <div className="container-wide relative z-10 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">
            Ready to Resolve Your Dispute?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Browse our templates and create a professional letter in minutes.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/#letters">
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
