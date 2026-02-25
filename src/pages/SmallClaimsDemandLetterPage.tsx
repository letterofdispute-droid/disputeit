import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import DemandLetterCostCalculator from '@/components/small-claims/DemandLetterCostCalculator';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, GitBranch, FileText, DollarSign } from 'lucide-react';

const SmallClaimsDemandLetterPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Demand Letter Cost Comparison - DIY vs. Lawyer vs. Templates"
        description="Compare the cost of writing your own demand letter, hiring a lawyer, or using a professional template. See how much you can save with our side-by-side calculator."
        canonicalPath="/small-claims/demand-letter-cost"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
          { name: 'Demand Letter Costs', url: `${siteUrl}/small-claims/demand-letter-cost` },
        ]}
        faqItems={[
          { question: 'How much does a demand letter cost?', answer: 'A lawyer-drafted demand letter typically costs $200-500. Professional templates cost $5-15, while writing your own is free but carries risks of missing key legal elements.' },
          { question: 'Can I write my own demand letter?', answer: 'Yes, but a poorly written demand letter can weaken your legal position. It must include specific legal elements like a clear demand, deadline, and consequences for non-compliance.' },
          { question: 'Do I need a lawyer to send a demand letter?', answer: 'No. Many successful demand letters are sent without a lawyer. Using a professionally drafted template ensures you include all necessary legal language at a fraction of the cost.' },
        ]}
      />

      {/* Hero */}
      <section style={{ background: 'var(--gradient-hero)' }} className="text-primary-foreground py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/small-claims" className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Small Claims Guide
            </Link>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
              <DollarSign className="h-4 w-4" /> Cost Comparison
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
              Demand Letter Cost Comparison
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              A demand letter is often required before filing in court - and it frequently resolves the dispute on its own. Compare your three options below to find the best approach for your situation.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <DemandLetterCostCalculator />

      {/* Educational Content */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h2 className="text-2xl font-bold font-serif text-foreground">Why Send a Demand Letter First?</h2>
            <p className="text-muted-foreground">
              A demand letter is a formal written notice that gives the other party a chance to resolve the dispute before legal action. Most small claims courts require you to attempt resolution before filing, and a well-crafted demand letter satisfies this requirement while also creating a paper trail that strengthens your case.
            </p>
            <p className="text-muted-foreground">
              Studies show that demand letters resolve disputes approximately 30-50% of the time without any court involvement. The key is including the right legal language, citing applicable consumer protection laws, and setting a clear deadline for response. Whether you choose to hire a lawyer, use a template, or write your own, the comparison above helps you make an informed choice.
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
              <Link to="/templates" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <FileText className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Browse Letter Templates</h3>
                <p className="text-sm text-muted-foreground">Find the right template for your dispute type.</p>
              </Link>
              <Link to="/small-claims/cost-calculator" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <Calculator className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Estimate Court Costs</h3>
                <p className="text-sm text-muted-foreground">Calculate filing fees and ROI for your claim.</p>
              </Link>
              <Link to="/small-claims/escalation-guide" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <GitBranch className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Escalation Guide</h3>
                <p className="text-sm text-muted-foreground">Follow the step-by-step complaint resolution path.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsDemandLetterPage;
