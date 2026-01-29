import { Target, ShieldCheck, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const pillars = [
  {
    icon: Target,
    title: 'Certainty',
    subtitle: 'Know exactly what you will get',
    description: 'Pre-validated letter templates with tested structure. No guessing, no prompt engineering, no trial and error.',
  },
  {
    icon: ShieldCheck,
    title: 'Correctness',
    subtitle: 'Legal-safe language, correct tone',
    description: 'No misleading statements that could weaken your claim. Proper references, appropriate escalation wording.',
  },
  {
    icon: Clock,
    title: 'Time Saved',
    subtitle: '5 minutes, not 5 hours',
    description: 'Skip the back-and-forth with generic AI. Get a ready-to-send letter without editing or proofreading.',
  },
];

const TrustIndicators = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            What You're Really Paying For
          </h2>
          <p className="text-lg text-muted-foreground">
            Not AI tokens. Not API calls. Real value that protects your interests.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pillars.map((pillar) => (
            <Card 
              key={pillar.title} 
              className="p-8 text-center hover:shadow-elevated transition-shadow"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <pillar.icon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm font-medium text-accent mb-3">
                {pillar.subtitle}
              </p>
              <p className="text-muted-foreground">
                {pillar.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
