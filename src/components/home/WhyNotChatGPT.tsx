import { Target, ShieldCheck, Clock } from 'lucide-react';

const proofPoints = [
  {
    icon: Target,
    title: 'Certainty',
    description: 'Pre-validated letter builders for your exact dispute type. No guesswork, no trial and error.',
  },
  {
    icon: ShieldCheck,
    title: 'Correctness',
    description: 'Legal-safe language that won\'t weaken your claim. Every word is purposeful.',
  },
  {
    icon: Clock,
    title: 'Time Saved',
    description: '5 minutes instead of hours. Skip the prompt engineering and get straight to results.',
  },
];

const WhyNotChatGPT = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Not Just Use ChatGPT?
          </h2>
          <p className="text-lg text-muted-foreground">
            Generic AI tools produce inconsistent results. Purpose-built letter builders deliver 
            predictable, professional letters every time.
          </p>
        </div>

        {/* 3-Column Proof Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {proofPoints.map((point, index) => (
            <div 
              key={index} 
              className="group relative p-8 bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 p-4 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <point.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Statement */}
        <div className="text-center">
          <div className="inline-block px-8 py-5 bg-accent/10 rounded-2xl border border-accent/20">
            <p className="text-lg md:text-xl font-medium text-foreground">
              You're not paying for AI. You're paying for{' '}
              <span className="text-accent font-semibold">certainty</span>,{' '}
              <span className="text-accent font-semibold">correctness</span>, and{' '}
              <span className="text-accent font-semibold">time saved</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyNotChatGPT;
