import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { Mail, Shield, ChevronRight } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PrivacyPage = () => {
  const lastUpdated = "February 19, 2026";
  const { openSettings } = useCookieConsent();
  const [activeSection, setActiveSection] = useState('introduction');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const tableOfContents = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-we-collect", title: "2. Information We Collect" },
    { id: "how-we-collect", title: "3. How We Collect Information" },
    { id: "how-we-use", title: "4. How We Use Your Information" },
    { id: "ai-data-processing", title: "5. AI Data Processing" },
    { id: "evidence-uploads", title: "6. Evidence & Document Uploads" },
    { id: "information-sharing", title: "7. Information Sharing" },
    { id: "data-retention", title: "8. Data Retention" },
    { id: "your-rights", title: "9. Your Privacy Rights" },
    { id: "gdpr-rights", title: "10. GDPR Rights (EU Residents)" },
    { id: "ccpa-rights", title: "11. CCPA Rights (California Residents)" },
    { id: "cookies", title: "12. Cookies and Tracking" },
    { id: "data-security", title: "13. Data Security" },
    { id: "international-transfers", title: "14. International Data Transfers" },
    { id: "children", title: "15. Children's Privacy" },
    { id: "changes", title: "16. Changes to This Policy" },
    { id: "contact", title: "17. Contact Information" },
  ];

  useEffect(() => {
    const sections = tableOfContents.map(t => document.getElementById(t.id)).filter(Boolean);
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach(s => s && observerRef.current?.observe(s));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Privacy Policy | Letter of Dispute"
        description="Learn how Letter of Dispute collects, uses, and protects your personal information. GDPR and CCPA compliant privacy practices."
        canonicalPath="/privacy"
        type="website"
      />

      {/* Branded Header Banner */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Shield className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">GDPR & CCPA Compliant</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-3">Privacy Policy</h1>
            <p className="text-primary-foreground/80 mb-4">
              How we collect, use, and protect your personal information when you use Letter of Dispute.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-primary-foreground/60">Last Updated: {lastUpdated}</span>
              <Button size="sm" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={openSettings}
              >
                Manage Cookie Settings
              </Button>
              <Button size="sm" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <a href="mailto:privacy@letterofdispute.com">Contact Privacy Team</a>
              </Button>
            </div>
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
              <nav className="grid grid-cols-1 gap-1">
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="text-primary hover:text-primary/80 hover:underline text-xs">
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section id="introduction" className="scroll-mt-24">
                <h2>1. Introduction</h2>
                <p>Letter of Dispute ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains our data practices for our website at letterofdispute.com.</p>
                <p>By using our Service, you agree to the collection and use of information in accordance with this policy. We process personal data in compliance with GDPR for EU residents and CCPA for California residents.</p>
              </section>

              <section id="information-we-collect" className="scroll-mt-24">
                <h2>2. Information We Collect</h2>
                <h3>Personal Information You Provide</h3>
                <ul>
                  <li><strong>Account Information:</strong> Name and email address when you create an account</li>
                  <li><strong>Dispute Details:</strong> Information you enter into letter templates</li>
                  <li><strong>Payment Information:</strong> Processed securely by Stripe; we do not store credit card numbers</li>
                  <li><strong>Communications:</strong> Information you provide when contacting our support team</li>
                  <li><strong>Dispute Outcome Data:</strong> Dispute titles, categories, amounts, and status you voluntarily log in the Dispute Tracker</li>
                </ul>

                <h3>Automatically Collected Information</h3>
                <ul>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns, referring URLs</li>
                  <li><strong>Cookies:</strong> Small data files stored on your device (see Section 12)</li>
                </ul>

                <div className="bg-primary/10 border-l-4 border-primary p-4 my-6 not-prose rounded-r-lg">
                  <p className="text-sm text-foreground">
                    <strong>Important:</strong> We minimize personal data collection. We never request full Social Security numbers, complete credit card details, or medical records. Letter templates only collect information necessary to create effective dispute letters.
                  </p>
                  <p className="text-sm text-foreground mt-2">
                    <strong>Note on Author Names:</strong> Author names on articles are editorial pseudonyms (pen names) and do not correspond to real individuals whose personal data we process.
                  </p>
                </div>
              </section>

              <section id="how-we-collect" className="scroll-mt-24">
                <h2>3. How We Collect Information</h2>
                <ul>
                  <li><strong>Direct Collection:</strong> Information you enter in forms, letter builders, and account settings</li>
                  <li><strong>Automated Collection:</strong> Through cookies, web beacons, and similar technologies</li>
                  <li><strong>Third-Party Services:</strong> Analytics providers and payment processors may collect data on our behalf</li>
                </ul>
              </section>

              <section id="how-we-use" className="scroll-mt-24">
                <h2>4. How We Use Your Information</h2>
                <h3>Contract Performance</h3>
                <ul>
                  <li>Processing your letter purchases and generating documents</li>
                  <li>Providing customer support and managing your account</li>
                </ul>
                <h3>Legitimate Interests</h3>
                <ul>
                  <li>Improving and optimizing our Service</li>
                  <li>Preventing fraud and abuse</li>
                  <li>Analyzing usage patterns to enhance user experience</li>
                </ul>
                <h3>Consent</h3>
                <ul>
                  <li>Sending marketing communications (with opt-in consent)</li>
                  <li>Using non-essential cookies</li>
                </ul>
                <h3>Legal Obligation</h3>
                <ul>
                  <li>Complying with applicable laws and responding to legal requests</li>
                </ul>
              </section>

              <section id="ai-data-processing" className="scroll-mt-24">
                <h2>5. AI Data Processing</h2>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-6 my-6 not-prose">
                  <div className="flex items-center gap-3 mb-4">
                    {/* AI chip icon SVG */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="7" y="7" width="10" height="10" rx="2" />
                      <path d="M7 9H5M7 12H5M7 15H5M17 9h2M17 12h2M17 15h2M9 7V5M12 7V5M15 7V5M9 17v2M12 17v2M15 17v2" />
                    </svg>
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Artificial Intelligence Disclosure</h3>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                    Our Service uses AI technology to generate personalized dispute letters and to score letters via our free Letter Analyzer tool.
                  </p>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li><strong>AI Letter Generation:</strong> Information you provide in letter forms is processed by AI to generate customized content.</li>
                    <li><strong>Free Letter Analyzer:</strong> When you use the Letter Analyzer, your submitted text is processed by AI for scoring but is not stored after analysis. No personal data is retained from analyzer sessions.</li>
                    <li><strong>Third-Party AI Providers:</strong> Your data may be transmitted to AI service providers under data processing agreements.</li>
                    <li><strong>No Training Use:</strong> Your personal information is NOT used to train AI models.</li>
                    <li><strong>Temporary Processing:</strong> AI systems process your data only for letter generation; data is not retained by AI providers beyond the processing session.</li>
                  </ul>
                </div>
              </section>

              <section id="evidence-uploads" className="scroll-mt-24">
                <h2>6. Evidence & Document Uploads</h2>
                <p>Our Service allows you to upload supporting documents to strengthen your dispute letters.</p>
                <h3>What We Collect</h3>
                <ul>
                  <li>Image files (JPEG, PNG) you upload as evidence</li>
                  <li>Document files you choose to attach</li>
                  <li>File metadata (filename, size, upload date)</li>
                </ul>
                <h3>Storage & Retention</h3>
                <ul>
                  <li><strong>Storage:</strong> Uploaded files are stored securely in encrypted cloud storage</li>
                  <li><strong>Retention Period:</strong> Evidence files are retained for 90 days after letter generation</li>
                  <li><strong>Deletion:</strong> Files are automatically deleted after the retention period</li>
                  <li><strong>Access:</strong> Only you (via your account) can access your uploaded files</li>
                </ul>
                <div className="bg-primary/10 border-l-4 border-primary p-4 my-6 not-prose rounded-r-lg">
                  <p className="text-sm text-foreground">
                    <strong>Important:</strong> Do not upload documents containing sensitive personal information (Social Security numbers, financial account numbers, medical records) unless necessary for your dispute.
                  </p>
                </div>
              </section>

              <section id="information-sharing" className="scroll-mt-24">
                <h2>7. Information Sharing</h2>
                <p>We do not sell your personal information. We may share information only in the following circumstances:</p>
                <h3>Service Providers</h3>
                <ul>
                  <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                  <li><strong>AI Providers:</strong> Letter content generation and scoring</li>
                  <li><strong>Hosting Providers:</strong> Secure cloud infrastructure</li>
                  <li><strong>Analytics Services:</strong> Understanding service usage</li>
                  <li><strong>Email Services:</strong> Delivering transactional emails</li>
                </ul>
                <h3>Legal Requirements</h3>
                <p>We may disclose information if required by law, court order, or to protect our rights and safety.</p>
                <h3>Business Transfers</h3>
                <p>In the event of a merger or acquisition, your information may be transferred as part of that transaction.</p>
              </section>

              <section id="data-retention" className="scroll-mt-24">
                <h2>8. Data Retention</h2>
                <ul>
                  <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion request</li>
                  <li><strong>Purchase Records:</strong> Retained for 7 years for tax and legal compliance</li>
                  <li><strong>Letter Content:</strong> Stored for 90 days after generation to allow re-downloads</li>
                  <li><strong>Evidence Uploads:</strong> Retained for 90 days after letter generation, then automatically deleted</li>
                  <li><strong>Dispute Tracker Data:</strong> Retained while your account is active; deleted upon account deletion request</li>
                  <li><strong>Analytics Data:</strong> Aggregated and anonymized after 26 months</li>
                </ul>
              </section>

              <section id="your-rights" className="scroll-mt-24">
                <h2>9. Your Privacy Rights</h2>
                <p>Depending on your location, you have specific rights regarding your personal data. We honor these rights for all users when technically feasible.</p>
                <p>To exercise any of these rights, contact us at privacy@letterofdispute.com.</p>
              </section>

              <section id="gdpr-rights" className="scroll-mt-24">
                <h2>10. GDPR Rights (EU Residents)</h2>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6 my-6 not-prose">
                  <div className="flex items-center gap-3 mb-4">
                    {/* EU stars SVG */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6 flex-shrink-0" fill="hsl(225 73% 57%)">
                      <circle cx="12" cy="5" r="1.2" />
                      <circle cx="17.2" cy="7.8" r="1.2" />
                      <circle cx="19" cy="13.5" r="1.2" />
                      <circle cx="16.4" cy="19" r="1.2" />
                      <circle cx="11" cy="21" r="1.2" />
                      <circle cx="5.6" cy="19" r="1.2" />
                      <circle cx="3" cy="13.5" r="1.2" />
                      <circle cx="4.8" cy="7.8" r="1.2" />
                      <circle cx="10" cy="5" r="1.2" />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">European Union Rights Under GDPR</h3>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    If you are a resident of the European Economic Area (EEA), you have the following rights:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                    <li><strong>Right to Erasure:</strong> Request deletion ("right to be forgotten")</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in machine-readable format</li>
                    <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                    <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                    <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local Data Protection Authority</li>
                  </ul>
                </div>
                <p>We will respond to your request within 30 days. No fee is required unless your request is manifestly unfounded or excessive.</p>
              </section>

              <section id="ccpa-rights" className="scroll-mt-24">
                <h2>11. CCPA Rights (California Residents)</h2>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-6 my-6 not-prose">
                  <div className="flex items-center gap-3 mb-4">
                    {/* CA bear icon SVG (simplified) */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="currentColor">
                      <path d="M6 8c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2l1 1v5h-1v2h-2v-2H8v2H6v-2H5v-5l1-1V8zm3 1a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM3 5c.6-.6 2-1 3-1s1 .5 1 1H7l-1 2H4L3 5zm18 0c-.6-.6-2-1-3-1s-1 .5-1 1h0l1 2h2l1-2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">California Consumer Rights Under CCPA</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li><strong>Right to Know:</strong> Request disclosure of categories and specific pieces of personal information collected</li>
                    <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                    <li><strong>Right to Opt-Out of Sale:</strong> We do NOT sell your personal information</li>
                    <li><strong>Right to Non-Discrimination:</strong> We will not discriminate for exercising your privacy rights</li>
                  </ul>
                </div>
                <p><strong>Do Not Sell My Personal Information:</strong> Letter of Dispute does not sell, rent, or trade your personal information to third parties for monetary or other valuable consideration.</p>
                <p>We will respond to verifiable consumer requests within 45 days.</p>
              </section>

              <section id="cookies" className="scroll-mt-24">
                <h2>12. Cookies and Tracking</h2>
                <p>We use cookies and similar technologies to enhance your experience. Our site implements a Cookie Consent Management Platform giving you full control, in compliance with GDPR and UK ePrivacy regulations.</p>
                <h3>Cookie Categories</h3>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for authentication, security, and core functionality. Cannot be disabled.</li>
                  <li><strong>Analytics Cookies:</strong> Google Tag Manager, Google Analytics 4, and reCAPTCHA Enterprise. Only loaded after explicit consent.</li>
                  <li><strong>Functional Cookies:</strong> Google Fonts loaded from CDN. Can be disabled without affecting core functionality.</li>
                </ul>
                <h3>Managing Your Cookie Preferences</h3>
                <p>You can change your preferences at any time by clicking{' '}
                  <button onClick={openSettings} className="text-primary underline hover:text-primary/80 cursor-pointer bg-transparent border-none p-0 font-inherit">
                    Cookie Settings
                  </button>
                  {' '}or see our{' '}
                  <Link to="/cookie-policy" className="text-primary hover:text-primary/80 underline">Cookie Policy</Link>.
                </p>
              </section>

              <section id="data-security" className="scroll-mt-24">
                <h2>13. Data Security</h2>
                <ul>
                  <li>All data transmitted via HTTPS/TLS encryption</li>
                  <li>Secure cloud infrastructure with regular security audits</li>
                  <li>Access controls limiting employee access to personal data</li>
                  <li>Payment processing handled by PCI-DSS compliant providers</li>
                  <li>Encrypted storage for uploaded evidence files</li>
                </ul>
                <p>While we strive to protect your data, no method of transmission over the Internet is 100% secure. We will notify you of any data breach as required by law.</p>
              </section>

              <section id="international-transfers" className="scroll-mt-24">
                <h2>14. International Data Transfers</h2>
                <p>Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place including Standard Contractual Clauses (SCCs) and data processing agreements with all third-party processors.</p>
              </section>

              <section id="children" className="scroll-mt-24">
                <h2>15. Children's Privacy</h2>
                <p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe your child has provided us with personal information, please contact us immediately.</p>
              </section>

              <section id="changes" className="scroll-mt-24">
                <h2>16. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last Updated" date and notify registered users via email for significant changes.</p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2>17. Contact Information</h2>
                <p>If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:</p>
              </section>
            </div>

            {/* Contact Card */}
            <div className="bg-muted rounded-xl p-6 mt-8 border border-border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Data Protection Contact</h3>
                  <p className="text-muted-foreground text-sm mb-3">For privacy inquiries, data access requests, or to exercise your rights:</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:privacy@letterofdispute.com" className="text-primary hover:underline">privacy@letterofdispute.com</a></p>
                    <p><strong>General Support:</strong> <a href="mailto:support@letterofdispute.com" className="text-primary hover:underline">support@letterofdispute.com</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
