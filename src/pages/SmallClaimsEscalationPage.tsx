import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import EscalationFlowchart from '@/components/small-claims/EscalationFlowchart';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, DollarSign, Scale } from 'lucide-react';

const SmallClaimsEscalationPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Complaint Escalation Guide — Step-by-Step Dispute Resolution Path"
        description="Follow the proven escalation path from first contact to court filing. Select your dispute category to see specific agencies, statutes, and next steps."
        canonicalPath="/small-claims/escalation-guide"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
          { name: 'Escalation Guide', url: `${siteUrl}/small-claims/escalation-guide` },
        ]}
      />

      {/* Intro */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/small-claims" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Small Claims Guide
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-foreground mb-4">
              Complaint Escalation Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not every dispute needs to go to court. Follow this step-by-step path to resolve your issue — starting with direct contact and escalating only when needed.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <EscalationFlowchart />

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
