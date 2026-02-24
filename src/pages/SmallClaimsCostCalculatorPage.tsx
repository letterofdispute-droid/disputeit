import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import CostCalculator from '@/components/small-claims/CostCalculator';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, MapPin, ArrowLeft } from 'lucide-react';

const SmallClaimsCostCalculatorPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Small Claims Court Cost Calculator — Estimate Filing Fees by State"
        description="Calculate your total small claims court costs including filing fees, service fees, and ROI. Free interactive tool with state-specific data for all 50 states."
        canonicalPath="/small-claims/cost-calculator"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
          { name: 'Cost Calculator', url: `${siteUrl}/small-claims/cost-calculator` },
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
              Small Claims Court Cost Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your state, dispute type, and claim amount to get a personalized breakdown of filing fees, service costs, and whether it's worth pursuing in court.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <CostCalculator />

      {/* What's Next */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-6 text-center">What's Next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/small-claims/demand-letter-cost" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <FileText className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Send a Demand Letter First</h3>
                <p className="text-sm text-muted-foreground">Compare DIY, lawyer, and template costs before filing.</p>
              </Link>
              <Link to="/state-rights" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <MapPin className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">View Your State's Guide</h3>
                <p className="text-sm text-muted-foreground">Find state-specific laws and consumer protections.</p>
              </Link>
              <Link to="/small-claims" className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <ArrowRight className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Back to Full Guide</h3>
                <p className="text-sm text-muted-foreground">Filing steps, tips, and FAQ for small claims court.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsCostCalculatorPage;
