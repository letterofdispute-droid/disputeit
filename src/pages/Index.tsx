import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import LetterCategories from '@/components/home/LetterCategories';
import HowItWorks from '@/components/home/HowItWorks';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <LetterCategories />
      <HowItWorks />
      <Pricing />
      <FAQ />
    </Layout>
  );
};

export default Index;
