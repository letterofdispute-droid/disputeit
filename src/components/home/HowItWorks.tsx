import { FileText, Edit3, Download, Send } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Choose Your Letter Type',
    description: 'Select a letter template designed for your exact dispute type. No prompt engineering required.',
    step: '01',
  },
  {
    icon: Edit3,
    title: 'Fill in the Details',
    description: 'Answer guided questions. No guessing what information is needed or how to phrase it.',
    step: '02',
  },
  {
    icon: Download,
    title: 'Generate Your Letter',
    description: 'Get a pre-validated letter template with correct legal tone, proper structure, and appropriate deadlines.',
    step: '03',
  },
  {
    icon: Send,
    title: 'Send & Get Results',
    description: 'Ready to send immediately. No editing, proofreading, or second-guessing required.',
    step: '04',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Create a professional dispute letter in four simple steps. 
            No legal knowledge required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}

              <div className="relative bg-card rounded-xl p-6 text-center shadow-soft group-hover:shadow-elevated transition-shadow">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <step.icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
