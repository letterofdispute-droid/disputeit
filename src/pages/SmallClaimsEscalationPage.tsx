import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import EscalationFlowchart from '@/components/small-claims/EscalationFlowchart';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, DollarSign, Scale, GitBranch } from 'lucide-react';

const SmallClaimsEscalationPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Complaint Escalation Guide - Step-by-Step Dispute Resolution Path"
        description="Follow the proven escalation path from first contact to court filing. Select your dispute category to see specific agencies, statutes, and next steps."
        canonicalPath="/small-claims/escalation-guide"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
          { name: 'Escalation Guide', url: `${siteUrl}/small-claims/escalation-guide` },
        ]}
        faqItems={[
          { question: 'What is the complaint escalation process?', answer: 'Escalation follows a structured path: direct contact with the company, written complaint, regulatory agency filing, mediation, and finally small claims court if all else fails.' },
          { question: 'When should I file a complaint with a government agency?', answer: 'File with a regulatory agency after the company fails to respond to your written complaint within 14-30 days, or if the issue involves consumer fraud, safety violations, or unfair business practices.' },
          { question: 'What is the difference between a complaint and a lawsuit?', answer: 'A complaint is an informal or regulatory filing that asks for resolution. A lawsuit is a formal legal action filed in court that results in a binding judgment.' },
        ]}
      />

      {/* Hero */}
      <section style={{ background: 'var(--gradient-hero)' }} className="text-primary-foreground py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/small-claims" className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Small Claims Guide
            </Link>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm text-primary-foreground/80 mb-4">
              <GitBranch className="h-4 w-4" /> Escalation Flowchart
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
              Complaint Escalation Guide
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Not every dispute needs to go to court. Follow this step-by-step path to resolve your issue - starting with direct contact and escalating only when needed.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <EscalationFlowchart />

      {/* Educational Content */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h2 className="text-2xl font-bold font-serif text-foreground">How Complaint Escalation Works</h2>
            <p className="text-muted-foreground">
              Most consumer disputes can be resolved without going to court. The key is following a structured escalation path that builds your case at each step. Start with a direct phone call or email to the company's customer service. If that fails, send a formal written complaint that documents the issue and your desired resolution.
            </p>
            <p className="text-muted-foreground">
              If the company still doesn't respond, your next steps depend on the type of dispute. For financial issues, you can file with the CFPB or your state's banking regulator. For product safety, contact the CPSC. For general consumer fraud, your state attorney general's office is often the most effective resource. Each of these agencies can investigate and sometimes compel the company to act.
            </p>
          </div>
        </div>
      </section>

      {/* What's Next */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-6 text-center">What's Next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/small-claims/cost-calculator" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <Calculator className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Estimate Court Costs</h3>
                <p className="text-sm text-muted-foreground">Calculate filing fees and ROI for your claim.</p>
              </Link>
              <Link to="/small-claims/demand-letter-cost" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <DollarSign className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Compare Demand Letter Costs</h3>
                <p className="text-sm text-muted-foreground">DIY vs. lawyer vs. our professional templates.</p>
              </Link>
              <Link to="/do-i-have-a-case" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <Scale className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Take the Case Quiz</h3>
                <p className="text-sm text-muted-foreground">Find out if your situation qualifies for court.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsEscalationPage;
