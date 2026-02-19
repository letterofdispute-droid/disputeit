import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Scale, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TermsPage = () => {
  const lastUpdated = "February 19, 2026";
  const [activeSection, setActiveSection] = useState('introduction');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const tableOfContents = [
    { id: 'intro', title: '1. Introduction' },
    { id: 'acceptance', title: '2. Acceptance of Terms' },
    { id: 'service', title: '3. Description of Service' },
    { id: 'ai-disclosure', title: '4. AI-Generated Content' },
    { id: 'personas', title: '5. Editorial Personas' },
    { id: 'gov-affiliation', title: '6. No Government Affiliation' },
    { id: 'disclaimer', title: '7. Legal Disclaimer' },
    { id: 'accounts', title: '8. User Accounts' },
    { id: 'purchases', title: '9. Purchases and Payments' },
    { id: 'refunds', title: '10. Refund Policy' },
    { id: 'ip', title: '11. Intellectual Property' },
    { id: 'prohibited', title: '12. Prohibited Uses' },
    { id: 'liability', title: '13. Limitation of Liability' },
    { id: 'warranties', title: '14. Disclaimer of Warranties' },
    { id: 'indemnification', title: '15. Indemnification' },
    { id: 'governing', title: '16. Governing Law' },
    { id: 'severability', title: '17. Severability' },
    { id: 'entire', title: '18. Entire Agreement' },
    { id: 'contact-terms', title: '19. Contact Information' },
  ];

  useEffect(() => {
    const sections = tableOfContents.map(t => document.getElementById(t.id)).filter(Boolean);
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach(s => s && observerRef.current?.observe(s));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Terms of Service | Letter of Dispute"
        description="Read the Terms of Service for Letter of Dispute. Understand your rights and responsibilities when using our AI-powered dispute letter generation service."
        canonicalPath="/terms"
        type="website"
      />

      {/* Branded Header Banner */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Scale className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Independent Private Service</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-3">Terms of Service</h1>
            <p className="text-primary-foreground/80 mb-4">
              Your rights and responsibilities when using Letter of Dispute's AI-powered letter generation platform.
            </p>
            <span className="text-sm text-primary-foreground/60">Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Sticky ToC — desktop only */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table of Contents</p>
              <nav className="space-y-0.5">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-md transition-colors',
                      activeSection === item.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {activeSection === item.id && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                    <span>{item.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile ToC */}
            <div className="md:hidden bg-muted/50 rounded-lg p-4 mb-8">
              <p className="text-sm font-semibold text-foreground mb-3">Table of Contents</p>
              <nav className="grid grid-cols-2 gap-1">
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="text-primary hover:underline text-xs">{item.title}</a>
                ))}
              </nav>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section id="intro">
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Letter of Dispute ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website at letterofdispute.com and our letter generation services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                </p>
              </section>

              <section id="acceptance">
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By creating an account, purchasing a letter, or otherwise using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 18 years old to use our Service.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms at any time. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
                </p>
              </section>

              <section id="service">
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Letter of Dispute provides a platform for generating professional dispute and complaint letters. Our Service includes:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access to letter templates for various dispute categories</li>
                  <li>An AI-powered letter generation tool that creates personalized letters based on your input</li>
                  <li>Downloadable letter documents in PDF and DOCX formats</li>
                  <li>Educational content about consumer rights and dispute resolution</li>
                  <li><strong className="text-foreground">Free Tools:</strong> State Consumer Rights Lookup, Statute of Limitations Calculator, Consumer News Hub, Free Letter Strength Analyzer, and Dispute Outcome Tracker — provided free of charge for informational purposes</li>
                </ul>
              </section>

              <section id="ai-disclosure" className="bg-muted/50 rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. AI-Generated Content Disclosure</h2>
                <div className="text-muted-foreground space-y-4">
                  <p className="font-semibold text-foreground">LETTERS ARE GENERATED USING ARTIFICIAL INTELLIGENCE TECHNOLOGY.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>AI Generation:</strong> Our letter templates and generated content are created using AI technology with editorial oversight.</li>
                    <li><strong>Not Attorney-Reviewed:</strong> Individual letters generated through our Service are NOT reviewed by licensed attorneys for your specific situation.</li>
                    <li><strong>No Legal Training:</strong> AI systems may produce content that is not appropriate for your specific jurisdiction or circumstances.</li>
                    <li><strong>User Verification Required:</strong> You are solely responsible for reviewing, verifying, and customizing any AI-generated content before use.</li>
                  </ul>
                </div>
              </section>

              <section id="personas" className="bg-muted/50 rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Editorial Personas and Pen Names</h2>
                <div className="text-muted-foreground space-y-4">
                  <p>All author names, biographies, and personas displayed on articles and blog posts on our Service are <strong className="text-foreground">fictional pen names (pseudonyms)</strong> created for editorial purposes.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Fictional Identities:</strong> Author bylines do not represent real individuals.</li>
                    <li><strong>No Professional Credentials:</strong> No author persona is a licensed attorney, legal professional, or financial advisor.</li>
                    <li><strong>Informational Content Only:</strong> All content published under any pen name is for general informational and educational purposes only.</li>
                    <li><strong>Not Real People:</strong> Any resemblance between our author personas and real individuals is entirely coincidental.</li>
                  </ul>
                </div>
              </section>

              {/* No Government Affiliation — destructive warning callout */}
              <section id="gov-affiliation">
                <div className="bg-destructive/5 rounded-xl p-6 border border-destructive/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-destructive/10 rounded-lg flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Important Notice</p>
                      <h2 className="text-2xl font-semibold text-foreground">6. No Government Affiliation</h2>
                    </div>
                  </div>
                  <div className="text-muted-foreground space-y-4">
                    <p className="font-semibold text-foreground">LETTER OF DISPUTE IS AN INDEPENDENT PRIVATE SERVICE.</p>
                    <p>We are NOT affiliated with, endorsed by, sponsored by, or connected to any government agency, including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>The Federal Trade Commission (FTC)</li>
                      <li>The Consumer Financial Protection Bureau (CFPB)</li>
                      <li>State Attorneys General offices</li>
                      <li>Any local, state, federal, or international government agency</li>
                      <li>Any consumer protection agency or ombudsman service</li>
                    </ul>
                    <p>References to laws, regulations, or government agencies in our content are for <strong>informational purposes only</strong> and do not represent official endorsement or affiliation.</p>
                  </div>
                </div>
              </section>

              <section id="disclaimer" className="bg-muted/50 rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Important Legal Disclaimer — "As Is" Use</h2>
                <div className="text-muted-foreground space-y-4">
                  <p className="font-semibold text-foreground">LETTER OF DISPUTE IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL ADVICE.</p>
                  <p>The letters, templates, and information provided through our Service are for informational and educational purposes only. No attorney-client relationship is created by your use of the Service.</p>
                  <p className="font-semibold text-foreground">ALL TEMPLATES AND LETTERS ARE PROVIDED "AS IS" AND ARE USED AT YOUR OWN RISK.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Templates are guidelines only</strong></li>
                    <li><strong>You assume all responsibility</strong> for reviewing, customizing, and sending any letter</li>
                    <li><strong>No guaranteed outcomes:</strong> We make no representations that using our templates will result in any particular outcome</li>
                    <li><strong>No liability accepted</strong> for damages arising from your use of our templates</li>
                  </ul>
                  <p>If you have a legal matter requiring professional advice, consult a licensed attorney in your jurisdiction.</p>
                </div>
              </section>

              <section id="accounts">
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">To access certain features, you may need to create an account. When creating an account, you agree to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section id="purchases">
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Purchases and Payments</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Pricing:</strong> All prices are in US dollars and are subject to change.</li>
                  <li><strong>Payment:</strong> We use Stripe for secure payment processing.</li>
                  <li><strong>Delivery:</strong> Upon successful payment, you receive immediate access to download your letter.</li>
                  <li><strong>No Recurring Charges:</strong> Unless you purchase a subscription, each purchase is a one-time transaction.</li>
                </ul>
              </section>

              <section id="refunds">
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Refund Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Refunds for letter purchases are handled on a case-by-case basis. If you experience a technical issue with your purchase, please contact us at support@letterofdispute.com within 14 days of purchase.
                </p>
                <p className="text-muted-foreground leading-relaxed">Refunds are provided at our discretion and may be denied in cases of abuse or if the Service was used as intended.</p>
              </section>

              <section id="ip">
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">All content on our website is the property of Letter of Dispute or our licensors. When you purchase a letter:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You receive a personal, non-exclusive license to use the generated letter for your own dispute resolution purposes</li>
                  <li>You may not resell, redistribute, or commercially exploit our templates or generated letters</li>
                </ul>
              </section>

              <section id="prohibited">
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">You agree not to use our Service to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Create fraudulent, false, or misleading letters or claims</li>
                  <li>Harass, threaten, or intimidate any person or organization</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Transmit viruses, malware, or other harmful code</li>
                  <li>Scrape, copy, or reproduce our content without authorization</li>
                </ul>
              </section>

              <section id="liability">
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW, LETTER OF DISPUTE SHALL NOT BE LIABLE FOR:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Any outcomes or results from disputes you pursue using our letters</li>
                  <li>Errors or omissions in our templates or generated content</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.</p>
              </section>

              <section id="warranties">
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
                </p>
              </section>

              <section id="indemnification">
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Letter of Dispute and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses arising out of your use of the Service or your violation of these Terms.
                </p>
              </section>

              <section id="governing">
                <h2 className="text-2xl font-semibold text-foreground mb-4">16. Governing Law and Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These Terms shall be governed by the laws of the State of Delaware, United States. Disputes shall first be attempted to be resolved through good-faith negotiation, then through binding arbitration in accordance with the American Arbitration Association rules.
                </p>
              </section>

              <section id="severability">
                <h2 className="text-2xl font-semibold text-foreground mb-4">17. Severability</h2>
                <p className="text-muted-foreground leading-relaxed">If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.</p>
              </section>

              <section id="entire">
                <h2 className="text-2xl font-semibold text-foreground mb-4">18. Entire Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">These Terms, together with our Privacy Policy and any other legal notices published on our website, constitute the entire agreement between you and Letter of Dispute regarding your use of the Service.</p>
              </section>

              <section id="contact-terms">
                <h2 className="text-2xl font-semibold text-foreground mb-4">19. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">If you have any questions about these Terms of Service, please contact us at:</p>
                <div className="bg-muted/30 rounded-lg p-4 text-muted-foreground">
                  <p><strong>Letter of Dispute</strong></p>
                  <p>Email: legal@letterofdispute.com</p>
                  <p>Website: letterofdispute.com/contact</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
