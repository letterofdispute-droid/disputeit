import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import TrustBadgesStrip from '@/components/shared/TrustBadgesStrip';
import WhatIsDisputeLetter from '@/components/home/WhatIsDisputeLetter';
import RealWorldScenarios from '@/components/home/RealWorldScenarios';
import SuccessStories from '@/components/home/SuccessStories';
import WhyNotChatGPT from '@/components/home/WhyNotChatGPT';
import LetterCategories from '@/components/home/LetterCategories';
import HowItWorks from '@/components/home/HowItWorks';
import TrustIndicators from '@/components/home/TrustIndicators';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';
import SEOHead from '@/components/SEOHead';
import { trackHomepageView } from '@/hooks/useGTM';

const Index = () => {
  useEffect(() => {
    trackHomepageView();
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Letter of Dispute - Professional Complaint Letter Generator | 500+ Templates"
        description="Generate professional complaint letters for refunds, housing issues, travel compensation, insurance claims, and more. 500+ legally-referenced templates ready in minutes."
        canonicalPath="/"
        type="website"
      />
      <Hero />
      
      {/* Trust Bar */}
      <div className="py-4 bg-muted/30 border-y border-border">
        <div className="container-wide">
          <TrustBadgesStrip variant="compact" />
        </div>
      </div>
      
      <WhatIsDisputeLetter />
      <RealWorldScenarios />
      <SuccessStories />
      <WhyNotChatGPT />
      <LetterCategories />
      <HowItWorks />
      <TrustIndicators />
      <Pricing />
      <FAQ />
    </Layout>
  );
};

export default Index;
