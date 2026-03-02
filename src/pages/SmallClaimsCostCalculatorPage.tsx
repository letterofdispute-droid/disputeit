import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { usePageSeo } from '@/hooks/usePageSeo';
import CostCalculator from '@/components/small-claims/CostCalculator';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, MapPin, ArrowLeft, Calculator } from 'lucide-react';

const SmallClaimsCostCalculatorPage = () => {
  const siteUrl = 'https://letterofdispute.com';

  const { title: seoTitle, description: seoDescription } = usePageSeo({
    slug: 'small-claims/cost-calculator',
    fallbackTitle: "Small Claims Court Cost Calculator - Estimate Filing Fees by State",
    fallbackDescription: "Calculate your total small claims court costs including filing fees, service fees, and ROI. Free interactive tool with state-specific data for all 50 states.",
  });

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/small-claims/cost-calculator"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court Guide', url: `${siteUrl}/small-claims` },
          { name: 'Cost Calculator', url: `${siteUrl}/small-claims/cost-calculator` },
        ]}
        faqItems={[
          { question: 'How much does it cost to file in small claims court?', answer: 'Filing fees vary by state and claim amount, typically ranging from $30 to $200. Our calculator provides exact fees for your state and situation.' },
          { question: 'Are there hidden fees in small claims court?', answer: 'Beyond filing fees, you may need to pay for service of process ($20-75), court copies, and potentially a small judgment recording fee. Our tool includes all common costs.' },
          { question: 'Is it worth suing in small claims court for $500?', answer: 'It depends on your state\'s filing fees and the strength of your case. Use our ROI calculator to see whether the potential recovery justifies the costs.' },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden text-primary-foreground py-16 md:py-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/small-claims" className="flex justify-center items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Small Claims Guide
            </Link>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
              <Calculator className="h-4 w-4" /> Interactive Tool
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
              Small Claims Court Cost Calculator
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Enter your state, dispute type, and claim amount to get a personalized breakdown of filing fees, service costs, and whether it's worth pursuing in court.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <CostCalculator />

      {/* Educational Content */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h2 className="text-2xl font-bold font-serif text-foreground">Understanding Small Claims Court Costs</h2>
            <p className="text-muted-foreground">
              Small claims court is designed to be affordable and accessible, but costs vary significantly by state. Filing fees typically range from $30 for small claims under $1,000 to over $200 for claims near the state maximum. In addition to the filing fee, you may need to pay for service of process, which can cost between $20 and $75 depending on whether you use the sheriff or a private process server.
            </p>
            <p className="text-muted-foreground">
              Before filing, it's important to calculate whether the potential recovery justifies the costs. If your claim is for $300 and filing plus service fees total $100, you need to weigh the likelihood of winning and actually collecting the judgment. Our calculator factors in all these variables to give you a clear picture of your expected return.
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
