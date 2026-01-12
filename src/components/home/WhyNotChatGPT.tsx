import { AlertTriangle, ShieldCheck, Lock, Target, Repeat, FileWarning } from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    problem: 'Wrong legal tone, mixed jurisdictions',
    solution: 'Pre-validated templates for specific dispute types',
  },
  {
    icon: FileWarning,
    problem: 'Omits required elements (references, deadlines)',
    solution: 'Controlled structure with all critical fields',
  },
  {
    icon: Repeat,
    problem: 'Inconsistent results, varies prompt to prompt',
    solution: 'Predictable, repeatable output every time',
  },
  {
    icon: Lock,
    problem: 'Privacy risks with personal data',
    solution: 'Data used only for generation, not stored',
  },
  {
    icon: Target,
    problem: 'Sounds professional but weakens claims',
    solution: 'Appropriate escalation wording, legally safe',
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
            Generic AI tools are powerful, but they're not built for formal dispute letters. 
            Here's why purpose-built templates deliver better results.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Headers */}
            <div className="hidden md:block p-4 bg-destructive/10 rounded-t-lg">
              <h3 className="font-semibold text-destructive text-center">
                Generic AI Problems
              </h3>
            </div>
            <div className="hidden md:block p-4 bg-success/10 rounded-t-lg">
              <h3 className="font-semibold text-success text-center">
                Our Solution
              </h3>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-4">
            {problems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Problem */}
                <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <item.icon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item.problem}</span>
                </div>
                {/* Solution */}
                <div className="flex items-start gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
                  <ShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Statement */}
        <div className="mt-12 text-center">
          <div className="inline-block px-6 py-4 bg-accent/10 rounded-xl border border-accent/30">
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
