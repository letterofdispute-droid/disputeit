import { Target, ShieldCheck, Clock, Camera } from 'lucide-react';

const proofPoints = [
  {
    icon: Target,
    title: 'Certainty',
    description: '500+ templates built for specific dispute types. No prompt engineering needed.',
  },
  {
    icon: ShieldCheck,
    title: 'Correctness',
    description: 'Purpose-trained models produce legal-safe language with proper citations. Generic AI may weaken your case.',
  },
  {
    icon: Camera,
    title: 'Evidence Support',
    description: 'Attach up to 10 photos directly embedded in your PDF. ChatGPT can\'t do that.',
  },
  {
    icon: Clock,
    title: 'Time Saved',
    description: '5 minutes from start to professional PDF. No back-and-forth with a chatbot.',
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
            Our models are trained specifically for consumer disputes. Generic AI produces 
            inconsistent, potentially harmful results.
          </p>
        </div>

        {/* 3-Column Proof Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
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
