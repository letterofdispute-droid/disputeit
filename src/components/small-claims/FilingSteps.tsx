import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Send, Calendar, Scale, CheckCircle, ClipboardList } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Step 1: Determine If Small Claims Is Right for You',
    content: 'Check if your claim amount falls within your state\'s filing limit. Small claims courts handle disputes involving money, from unpaid debts and security deposits to property damage and breach of contract. If your claim exceeds the limit, you can either reduce it to fit or file in a higher court.',
  },
  {
    icon: Send,
    title: 'Step 2: Send a Demand Letter First',
    content: 'Before filing, send a formal demand letter to the other party. This is often required by courts and shows you attempted to resolve the dispute. A well-crafted demand letter frequently resolves the issue without needing to go to court, saving you time and filing fees.',
  },
  {
    icon: FileText,
    title: 'Step 3: Fill Out the Court Forms',
    content: 'Visit your local courthouse or court website to get the required forms. You\'ll need to provide your name, the defendant\'s name and address, the amount you\'re claiming, and a brief description of the dispute. Many states now offer online filing.',
  },
  {
    icon: Calendar,
    title: 'Step 4: File Your Claim and Pay the Fee',
    content: 'Submit your completed forms to the court clerk along with the filing fee (typically $15–$100 depending on your state and claim amount). The court will set a hearing date, usually 30–60 days out.',
  },
  {
    icon: Send,
    title: 'Step 5: Serve the Defendant',
    content: 'The defendant must be officially notified (served) about the lawsuit. Depending on your state, this can be done by certified mail, a process server, or the sheriff\'s office. You cannot serve the papers yourself.',
  },
  {
    icon: Scale,
    title: 'Step 6: Prepare Your Evidence',
    content: 'Gather all relevant documents: contracts, receipts, photos, text messages, emails, repair estimates, and any written communication with the other party. Organize them chronologically and make copies for the judge and the defendant.',
  },
  {
    icon: CheckCircle,
    title: 'Step 7: Attend Your Hearing',
    content: 'Arrive early, dress professionally, and bring all your evidence. Present your case clearly and concisely. Explain what happened, what you\'re owed, and why. The judge will typically issue a decision the same day or within a few weeks.',
  },
];

const FilingSteps = () => {
  return (
    <section id="how-to-file" className="py-16">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3 text-center">
            How to File a Small Claims Case
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-10">
            A step-by-step guide to filing and winning your case, no lawyer required.
          </p>

          <Accordion type="single" collapsible className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <AccordionItem
                  key={i}
                  value={`step-${i}`}
                  className="border border-border rounded-xl px-5 data-[state=open]:bg-card data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{step.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5 pl-14">
                    {step.content}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FilingSteps;
