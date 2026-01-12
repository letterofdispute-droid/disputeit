import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import WhyNotChatGPT from '@/components/home/WhyNotChatGPT';
import LetterCategories from '@/components/home/LetterCategories';
import HowItWorks from '@/components/home/HowItWorks';
import TrustIndicators from '@/components/home/TrustIndicators';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';

const Index = () => {
  return (
    <Layout>
      <Hero />
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
