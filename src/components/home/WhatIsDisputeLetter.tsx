import { FileText, ClipboardList, Scale, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: FileText,
    title: 'Formal Documentation',
    description:
      'A written complaint that clearly states your issue, what went wrong, and what you want resolved. It shows you mean business.',
  },
  {
    icon: ClipboardList,
    title: 'Creates a Paper Trail',
    description:
      'Companies take letters more seriously than calls or emails because there\'s a dated record. It\'s harder to ignore or deny.',
  },
  {
    icon: Scale,
    title: 'Often Required First',
    description:
      'Many disputes require a written attempt before legal escalation. A letter protects your rights and proves you tried.',
  },
];

const WhatIsDisputeLetter = () => {
  const scrollToScenarios = () => {
    document.getElementById('scenarios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Is a Dispute Letter?
          </h2>
          <p className="text-lg text-muted-foreground">
            A dispute letter is a formal, written communication that documents your complaint and
            requests a specific resolution. Unlike phone calls or casual emails, it creates an
            official record that companies take seriously.
          </p>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-elevated transition-shadow text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={scrollToScenarios}
            className="text-primary hover:text-primary/80"
          >
            See real examples
            <ArrowDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WhatIsDisputeLetter;
