import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Shield, Users, Scale } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Precision',
    description: 'Every template is crafted with legal precision, ensuring your dispute has the strongest foundation.',
  },
  {
    icon: Shield,
    title: 'Protection',
    description: 'We empower consumers to stand up for their rights with confidence and professional documentation.',
  },
  {
    icon: Users,
    title: 'Accessibility',
    description: 'Professional dispute resolution should be available to everyone, not just those who can afford lawyers.',
  },
  {
    icon: Scale,
    title: 'Fairness',
    description: 'We believe in leveling the playing field between consumers and corporations.',
  },
];

const AboutPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="About Us | DisputeLetters"
        description="Learn about DisputeLetters - our mission to empower consumers with professional dispute resolution tools."
      />

      {/* Hero */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Empowering Consumers to Protect Their Rights
            </h1>
            <p className="text-lg text-primary-foreground/80">
              DisputeLetters was founded on a simple belief: everyone deserves access to 
              professional dispute resolution tools, regardless of their budget.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Too often, consumers face an uphill battle when dealing with companies that have 
                wronged them. Without legal expertise, many people don't know how to effectively 
                communicate their grievances in a way that gets results.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                That's where we come in. DisputeLetters provides pre-validated, legally-sound 
                templates that give everyday consumers the same quality of formal communication 
                that expensive lawyers produce.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We've taken the guesswork out of dispute resolution. Our templates are designed 
                by legal professionals, tested against real-world scenarios, and continuously 
                improved based on user feedback and success rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
            Our Values
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

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container-wide text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">
            Ready to Resolve Your Dispute?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of consumers who have successfully resolved their disputes using our templates.
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
