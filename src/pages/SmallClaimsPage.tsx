import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import USMap from '@/components/small-claims/USMap';
import StateLookup from '@/components/small-claims/StateLookup';
import FilingSteps from '@/components/small-claims/FilingSteps';
import CostBreakdown from '@/components/small-claims/CostBreakdown';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, FileText, Shield, ArrowRight, Gavel, Calculator, DollarSign, GitBranch, ChevronDown } from 'lucide-react';

const faqItems = [
  { question: 'What is small claims court?', answer: 'Small claims court is a special court where disputes are resolved quickly and inexpensively. The rules are simplified so that individuals can represent themselves without an attorney. Filing limits range from $2,500 to $25,000 depending on the state.' },
  { question: 'How much can I sue for in small claims court?', answer: 'Filing limits vary by state, from $2,500 (Kentucky) to $25,000 (Delaware, Tennessee). Most states set the limit between $5,000 and $10,000. Use our state lookup tool above to find your state\'s exact limit.' },
  { question: 'Do I need a lawyer for small claims court?', answer: 'In most cases, no. Small claims courts are designed for self-representation. In fact, many states (including California, Michigan, and Washington) don\'t allow lawyers at all. You present your case directly to the judge.' },
  { question: 'How long does a small claims case take?', answer: 'From filing to hearing, most cases take 30–60 days. The hearing itself typically lasts 15–30 minutes. The judge usually issues a decision the same day or within a few weeks.' },
  { question: 'What can I sue for in small claims court?', answer: 'Common small claims cases include: unpaid debts, security deposit disputes, property damage, breach of contract, defective products, auto repair disputes, landlord-tenant issues, and personal injury claims under the limit.' },
  { question: 'Should I send a demand letter before filing?', answer: 'Yes, almost always. Many courts require you to show you attempted to resolve the dispute first. A formal demand letter often resolves the issue without court. It also strengthens your case if you do go to court.' },
  { question: 'What happens if I win but the defendant doesn\'t pay?', answer: 'If the defendant doesn\'t voluntarily pay the judgment, you can use enforcement mechanisms: wage garnishment, bank levies, property liens, or having the sheriff seize assets. The court clerk can guide you through the collection process.' },
  { question: 'Can I file small claims court online?', answer: 'Many states now offer e-filing for small claims, including New York, California, Utah, and Wisconsin. Check your state\'s court website or use our state lookup tool to find online filing options.' },
];

const SmallClaimsPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Small Claims Court: The Complete Guide (2026) - Filing Limits, Fees & Forms"
        description="Everything you need to know about small claims court: state-by-state filing limits, fees, forms, and step-by-step instructions. Free interactive tools to help you file and win."
        canonicalPath="/small-claims"
        faqItems={faqItems}
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background image + dark blue overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-primary/90" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 animate-fade-in">
              <Gavel className="h-4 w-4" />
              <span>Free Interactive Guide - Updated for 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-6 leading-tight animate-fade-up">
              Small Claims Court:{' '}
              <span className="text-accent">The Complete Guide</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
              File your case with confidence. State-by-state filing limits, fees, forms, and a step-by-step walkthrough, all in one place.
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Button size="lg" variant="accent" asChild>
                <a href="#state-lookup">
                  <Scale className="mr-2 h-5 w-5" /> Look Up Your State
                </a>
              </Button>
              <Button size="lg" variant="heroOutline" asChild>
                <a href="#free-tools">
                  Explore Free Tools <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* Scroll indicator */}
            <a href="#what-is" className="mt-10 inline-flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <span className="text-xs font-medium tracking-wide uppercase">Learn more</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* What is Small Claims Court */}
      <section id="what-is" className="py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">What Is Small Claims Court?</h2>
            <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Small claims court is a special division of the court system designed to resolve disputes involving relatively small amounts of money, quickly, affordably, and without the need for an attorney. Every state has one, though the name, rules, and dollar limits vary.
              </p>
              <p>
                Unlike regular civil court, small claims cases are heard by a judge (no jury), the rules of evidence are relaxed, and the entire process from filing to hearing typically takes just 30-60 days. Filing fees are minimal, usually between $15 and $100.
              </p>
              <p>
                Common small claims cases include unpaid debts, security deposit disputes, property damage from a car accident, breach of contract, defective products, and disputes with contractors or landlords.
              </p>
            </div>

            {/* CTA: Demand Letter */}
            <div className="mt-10 bg-accent/5 border border-accent/20 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 flex-shrink-0">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Before You File: Send a Demand Letter</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Most courts require proof that you tried to resolve the dispute first. A professional demand letter often resolves the issue without needing to go to court, saving you time and money.
                </p>
                <Button variant="default" size="sm" asChild>
                  <Link to="/templates">
                    Browse Demand Letter Templates <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive US Map */}
      <USMap />

      {/* Interactive State Lookup (dropdown fallback) */}
      <StateLookup />

      {/* Do I Have a Case? CTA */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-8 flex flex-col sm:flex-row items-start gap-5">
              <div className="p-3 rounded-xl bg-accent/10 flex-shrink-0">
                <Scale className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold font-serif text-foreground mb-2">Not Sure If You Have a Case?</h3>
                <p className="text-muted-foreground mb-4">
                  Answer a few quick questions about your situation and we'll help you figure out whether small claims court is the right path and what to do next.
                </p>
                <Button variant="accent" asChild>
                  <Link to="/do-i-have-a-case">
                    Take the Free Quiz <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to File Steps */}
      <FilingSteps />

      {/* Cost Breakdown */}
      {/* Cost Breakdown */}
      <CostBreakdown />

      {/* Free Tools Grid */}
      <section id="free-tools" className="py-16">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-2 text-center">Free Interactive Tools</h2>
            <p className="text-muted-foreground text-center mb-8">Deep-dive into the numbers with our free calculators and guides.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Link to="/small-claims/cost-calculator" className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/30">
                <div className="p-3 rounded-xl bg-primary/8 w-fit mb-4">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">Court Cost Calculator</h3>
                <p className="text-sm text-muted-foreground mb-4">Estimate filing fees, service costs & ROI for your specific case.</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  Try It Free <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link to="/small-claims/demand-letter-cost" className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/30">
                <div className="p-3 rounded-xl bg-primary/8 w-fit mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">Demand Letter Costs</h3>
                <p className="text-sm text-muted-foreground mb-4">Compare DIY vs. lawyer vs. our templates.</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  Compare Options <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link to="/small-claims/escalation-guide" className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/30">
                <div className="p-3 rounded-xl bg-primary/8 w-fit mb-4">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">Escalation Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">Step-by-step path from first contact to court.</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  See the Steps <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Do You Need a Lawyer? */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">Do You Need a Lawyer for Small Claims Court?</h2>
            <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong>Short answer: No.</strong> Small claims courts are specifically designed so that ordinary people can represent themselves. The procedures are simplified, the rules of evidence are relaxed, and judges are accustomed to hearing from non-lawyers.
              </p>
              <p>
                In fact, many states including California, Michigan, Washington, Kansas, Idaho, and Nebraska don't allow lawyers at all in small claims hearings. Even in states where lawyers are permitted, most people choose to represent themselves.
              </p>
              <p>
                The key to success isn't legal training, it's <strong>preparation</strong>. Bring organized evidence (contracts, photos, receipts, messages), be concise, and focus on the facts. The judge wants to hear what happened, what you're owed, and why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Win */}
      <section className="py-16 bg-secondary/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-6">How to Win in Small Claims Court</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Document Everything', desc: 'Contracts, receipts, photos, texts, and emails. The more evidence you have, the stronger your case.' },
                { title: 'Send a Demand Letter', desc: 'Shows the judge you tried to resolve it first. Courts look favorably on plaintiffs who made good-faith efforts.' },
                { title: 'Know Your State\'s Laws', desc: 'Reference specific consumer protection statutes when applicable. Our state guides can help you identify relevant laws.' },
                { title: 'Be Professional & Concise', desc: 'Dress professionally, speak calmly, stick to the facts. Judges appreciate clear, organized presentations.' },
                { title: 'Bring Witnesses', desc: 'If someone witnessed the incident, bring them to testify. Written statements (affidavits) can also be submitted.' },
                { title: 'Practice Your Presentation', desc: 'You\'ll have 10–15 minutes. Practice telling your story chronologically: what happened, the harm, and what you want.' },
              ].map((tip, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-xl px-5"
                >
                  <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold font-serif mb-4">Ready to Take Action?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Start with a professional demand letter. It often resolves disputes without needing court and strengthens your case if you do file.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/templates">
                <FileText className="mr-2 h-5 w-5" /> Browse Letter Templates
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-primary-foreground hover:bg-white/10" asChild>
              <Link to="/small-claims/statement-generator">
                Free Statement Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsPage;
