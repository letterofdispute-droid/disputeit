import { MessageSquare, FileCheck, CheckCircle } from 'lucide-react';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  step: string;
}

const steps: Step[] = [
  {
    icon: MessageSquare,
    title: 'Tell Your Story',
    description: 'Describe your situation in plain English. Our system asks the right questions to understand exactly what went wrong — no legalese required.',
    step: '01',
  },
  {
    icon: FileCheck,
    title: 'Get Your Custom Letter',
    description: 'We select the strongest legal arguments for your specific case and generate a professional, legal-safe letter ready for your signature.',
    step: '02',
  },
  {
    icon: CheckCircle,
    title: 'Send and Resolve',
    description: 'We provide the exact mailing address or agency complaint link you need. Send your letter and track your path to resolution.',
    step: '03',
  },
];

interface StepCardProps {
  step: Step;
  index: number;
  isLast: boolean;
}

const StepCard = ({ step, isLast }: StepCardProps) => {
  return (
    <div className="relative group pt-5">
      {/* Step Number Badge */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center shadow-md z-10">
        {step.step}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-border" />
      )}

      <div className="relative bg-card rounded-xl overflow-hidden shadow-soft group-hover:shadow-elevated transition-shadow">
        <div className="relative p-6 pt-4 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <step.icon className="h-8 w-8" />
          </div>

          {/* Content */}
          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            3 Steps to Resolution
          </h2>
          <p className="text-lg text-muted-foreground">
            From first description to final resolution — your complete dispute toolkit in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {steps.map((step, index) => (
            <StepCard 
              key={step.title} 
              step={step} 
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
