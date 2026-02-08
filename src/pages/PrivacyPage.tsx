import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Mail, Shield } from 'lucide-react';

const PrivacyPage = () => {
  const lastUpdated = "February 8, 2026";

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

  return (
    <Layout>
      <SEOHead
        title="Privacy Policy | Letter of Dispute"
        description="Learn how Letter of Dispute collects, uses, and protects your personal information. GDPR and CCPA compliant privacy practices."
        canonicalPath="/privacy"
        type="website"
      />

      <div className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: {lastUpdated}</p>
          </div>

          {/* Table of Contents */}
          <div className="bg-muted/50 rounded-lg p-6 mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-primary hover:text-primary/80 hover:underline text-sm"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-24">
              <h2>1. Introduction</h2>
              <p>
                Letter of Dispute ("we," "us," or "our") is committed to protecting your privacy and ensuring you understand how we collect, use, and safeguard your personal information. This Privacy Policy explains our data practices for our website at letterofdispute.com (the "Service").
              </p>
              <p>
                By using our Service, you agree to the collection and use of information in accordance with this policy. We process personal data in compliance with the General Data Protection Regulation (GDPR) for EU residents and the California Consumer Privacy Act (CCPA) for California residents.
              </p>
            </section>

            {/* Section 2 */}
            <section id="information-we-collect" className="scroll-mt-24">
              <h2>2. Information We Collect</h2>
              
              <h3>Personal Information You Provide</h3>
              <p>We collect information you voluntarily provide when using our Service:</p>
              <ul>
                <li><strong>Account Information:</strong> Name and email address when you create an account</li>
                <li><strong>Dispute Details:</strong> Information you enter into letter templates (e.g., company names, dates, descriptions of issues)</li>
                <li><strong>Payment Information:</strong> Payment details are processed securely by Stripe; we do not store credit card numbers on our servers</li>
                <li><strong>Communications:</strong> Information you provide when contacting our support team</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>When you visit our Service, we automatically collect certain information:</p>
              <ul>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns, referring URLs</li>
                <li><strong>Cookies:</strong> Small data files stored on your device (see Section 12 for details)</li>
              </ul>

              <div className="bg-primary/10 border-l-4 border-primary p-4 my-6 not-prose">
                <p className="text-sm text-foreground">
                  <strong>Important:</strong> We are designed to minimize personal data collection. We never request sensitive information like full Social Security numbers, complete credit card details, or medical records. Our letter templates only collect information necessary to create effective dispute letters.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="how-we-collect" className="scroll-mt-24">
              <h2>3. How We Collect Information</h2>
              <p>We collect information through the following methods:</p>
              <ul>
                <li><strong>Direct Collection:</strong> Information you enter in forms, letter builders, and account settings</li>
                <li><strong>Automated Collection:</strong> Through cookies, web beacons, and similar technologies</li>
                <li><strong>Third-Party Services:</strong> Analytics providers and payment processors may collect data on our behalf</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2>4. How We Use Your Information</h2>
              <p>We process your personal data based on the following legal bases under GDPR:</p>
              
              <h3>Contract Performance</h3>
              <ul>
                <li>Processing your letter purchases and generating documents</li>
                <li>Providing customer support</li>
                <li>Managing your account</li>
              </ul>

              <h3>Legitimate Interests</h3>
              <ul>
                <li>Improving and optimizing our Service</li>
                <li>Preventing fraud and abuse</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Ensuring security of our platform</li>
              </ul>

              <h3>Consent</h3>
              <ul>
                <li>Sending marketing communications (with opt-in consent)</li>
                <li>Using non-essential cookies</li>
              </ul>

              <h3>Legal Obligation</h3>
              <ul>
                <li>Complying with applicable laws and regulations</li>
                <li>Responding to legal requests and preventing harm</li>
              </ul>
            </section>

            {/* Section 5 - AI Data Processing (NEW) */}
            <section id="ai-data-processing" className="scroll-mt-24">
              <h2>5. AI Data Processing</h2>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-6 my-6 not-prose">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Artificial Intelligence Disclosure</h3>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                  Our Service uses artificial intelligence (AI) technology to generate personalized dispute letters. By using our Service, you acknowledge and consent to the following:
                </p>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li><strong>AI Processing:</strong> Information you provide in letter forms is processed by AI systems to generate customized letter content.</li>
                  <li><strong>Third-Party AI Providers:</strong> Your data may be transmitted to third-party AI service providers for processing. These providers are bound by data processing agreements.</li>
                  <li><strong>No Training Use:</strong> Your personal information and uploaded documents are NOT used to train AI models.</li>
                  <li><strong>Temporary Processing:</strong> AI systems process your data only for the purpose of generating your letter; data is not retained by AI providers beyond the processing session.</li>
                  <li><strong>Human Oversight:</strong> Our editorial team reviews template structures but does not review individual letters you generate.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 - Evidence Uploads (NEW) */}
            <section id="evidence-uploads" className="scroll-mt-24">
              <h2>6. Evidence & Document Uploads</h2>
              <p>Our Service allows you to upload supporting documents (such as receipts, photos, contracts, or other evidence) to strengthen your dispute letters. Here's how we handle uploaded files:</p>
              
              <h3>What We Collect</h3>
              <ul>
                <li>Image files (JPEG, PNG, etc.) you upload as evidence</li>
                <li>Document files you choose to attach</li>
                <li>File metadata (filename, size, upload date)</li>
              </ul>

              <h3>How We Use Uploads</h3>
              <ul>
                <li>Uploads are processed to include in your generated letter documents</li>
                <li>Images may be compressed for optimal document formatting</li>
                <li>Files are associated with your letter purchase for retrieval</li>
              </ul>

              <h3>Storage & Retention</h3>
              <ul>
                <li><strong>Storage:</strong> Uploaded files are stored securely in encrypted cloud storage</li>
                <li><strong>Retention Period:</strong> Evidence files are retained for 90 days after letter generation to allow re-downloads</li>
                <li><strong>Deletion:</strong> Files are automatically deleted after the retention period; you may request earlier deletion</li>
                <li><strong>Access:</strong> Only you (via your account) can access your uploaded files</li>
              </ul>

              <div className="bg-primary/10 border-l-4 border-primary p-4 my-6 not-prose">
                <p className="text-sm text-foreground">
                  <strong>Important:</strong> Do not upload documents containing sensitive personal information (Social Security numbers, financial account numbers, medical records) unless necessary for your dispute. Redact sensitive information before uploading when possible.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="information-sharing" className="scroll-mt-24">
              <h2>7. Information Sharing</h2>
              <p>We do not sell your personal information. We may share information only in the following circumstances:</p>
              
              <h3>Service Providers</h3>
              <ul>
                <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                <li><strong>AI Providers:</strong> Letter content generation (data processing agreements in place)</li>
                <li><strong>Hosting Providers:</strong> Secure cloud infrastructure</li>
                <li><strong>Analytics Services:</strong> Understanding service usage</li>
                <li><strong>Email Services:</strong> Delivering transactional emails</li>
              </ul>

              <h3>Legal Requirements</h3>
              <p>We may disclose information if required by law, court order, or government request, or to protect our rights and safety.</p>

              <h3>Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
            </section>

            {/* Section 8 */}
            <section id="data-retention" className="scroll-mt-24">
              <h2>8. Data Retention</h2>
              <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:</p>
              <ul>
                <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion request</li>
                <li><strong>Purchase Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Letter Content:</strong> Stored for 90 days after generation to allow re-downloads</li>
                <li><strong>Evidence Uploads:</strong> Retained for 90 days after letter generation, then automatically deleted</li>
                <li><strong>Analytics Data:</strong> Aggregated and anonymized after 26 months</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="your-rights" className="scroll-mt-24">
              <h2>9. Your Privacy Rights</h2>
              <p>
                Depending on your location, you have specific rights regarding your personal data. We honor these rights for all users regardless of location when technically feasible.
              </p>
              <p>To exercise any of these rights, contact us at privacy@letterofdispute.com.</p>
            </section>

            {/* Section 10 - GDPR */}
            <section id="gdpr-rights" className="scroll-mt-24">
              <h2>10. GDPR Rights (EU Residents)</h2>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-6 my-6 not-prose">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">European Union Rights Under GDPR</h3>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  If you are a resident of the European Economic Area (EEA), you have the following rights:
                </p>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing</li>
                  <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local Data Protection Authority</li>
                </ul>
              </div>
              <p>We will respond to your request within 30 days. No fee is required unless your request is manifestly unfounded or excessive.</p>
            </section>

            {/* Section 11 - CCPA */}
            <section id="ccpa-rights" className="scroll-mt-24">
              <h2>11. CCPA Rights (California Residents)</h2>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-6 my-6 not-prose">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">California Consumer Rights Under CCPA</h3>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                  If you are a California resident, you have the following rights under the California Consumer Privacy Act:
                </p>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected</li>
                  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                  <li><strong>Right to Opt-Out of Sale:</strong> We do NOT sell your personal information</li>
                  <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
                </ul>
              </div>
              <p>
                <strong>Do Not Sell My Personal Information:</strong> Letter of Dispute does not sell, rent, or trade your personal information to third parties for monetary or other valuable consideration. Therefore, we do not offer an opt-out for the sale of personal information.
              </p>
              <p>We will respond to verifiable consumer requests within 45 days.</p>
            </section>

            {/* Section 12 */}
            <section id="cookies" className="scroll-mt-24">
              <h2>12. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to enhance your experience:</p>
              
              <h3>Essential Cookies</h3>
              <p>Required for the Service to function properly (authentication, security, preferences). These cannot be disabled.</p>
              
              <h3>Analytics Cookies</h3>
              <p>Help us understand how visitors interact with our Service. You can opt out of these through your browser settings.</p>
              
              <h3>Managing Cookies</h3>
              <p>You can control cookies through your browser settings. Note that disabling certain cookies may limit functionality of our Service.</p>
            </section>

            {/* Section 13 */}
            <section id="data-security" className="scroll-mt-24">
              <h2>13. Data Security</h2>
              <p>We implement robust security measures to protect your personal data:</p>
              <ul>
                <li>All data transmitted via HTTPS/TLS encryption</li>
                <li>Secure cloud infrastructure with regular security audits</li>
                <li>Access controls limiting employee access to personal data</li>
                <li>Regular security assessments and vulnerability testing</li>
                <li>Payment processing handled by PCI-DSS compliant providers</li>
                <li>Encrypted storage for uploaded evidence files</li>
              </ul>
              <p>
                While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security but will notify you of any data breach as required by law.
              </p>
            </section>

            {/* Section 14 */}
            <section id="international-transfers" className="scroll-mt-24">
              <h2>14. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:
              </p>
              <ul>
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Service providers with Privacy Shield certification or equivalent protections</li>
                <li>Data processing agreements with all third-party processors</li>
              </ul>
            </section>

            {/* Section 15 */}
            <section id="children" className="scroll-mt-24">
              <h2>15. Children's Privacy</h2>
              <p>
                Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
              <p>
                If we discover that we have collected personal information from a child under 18, we will take steps to delete that information promptly.
              </p>
            </section>

            {/* Section 16 */}
            <section id="changes" className="scroll-mt-24">
              <h2>16. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we will:
              </p>
              <ul>
                <li>Update the "Last Updated" date at the top of this page</li>
                <li>Notify registered users via email for significant changes</li>
                <li>Display a prominent notice on our Service</li>
              </ul>
              <p>
                Your continued use of the Service after changes become effective constitutes your acceptance of the updated policy.
              </p>
            </section>

            {/* Section 17 */}
            <section id="contact" className="scroll-mt-24">
              <h2>17. Contact Information</h2>
              <p>If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:</p>
            </section>
          </div>

          {/* Contact Card */}
          <div className="bg-muted rounded-lg p-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Data Protection Contact</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  For privacy inquiries, data access requests, or to exercise your rights:
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> <a href="mailto:privacy@letterofdispute.com" className="text-primary hover:underline">privacy@letterofdispute.com</a></p>
                  <p><strong>General Support:</strong> <a href="mailto:support@letterofdispute.com" className="text-primary hover:underline">support@letterofdispute.com</a></p>
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
