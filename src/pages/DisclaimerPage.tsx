import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { AlertTriangle, Scale, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const DisclaimerPage = () => {
  return (
    <Layout>
      <SEOHead
        title="Legal Disclaimer | Letter of Dispute"
        description="Important legal disclaimer: Letter of Dispute is not a law firm. Our AI-generated letter templates are for informational purposes only and do not constitute legal advice."
        canonicalPath="/disclaimer"
        type="website"
      />

      <div className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Legal Disclaimer
            </h1>
            <p className="text-muted-foreground">
              Last updated: February 8, 2026
            </p>
          </div>

          {/* Critical Warning Box */}
          <Alert className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription className="text-foreground ml-2">
              <strong className="text-destructive">Important:</strong> Letter of Dispute is NOT a law firm and does not provide legal advice. 
              Our AI-generated letter templates are for informational and educational purposes only. No attorney-client relationship 
              is created by using our services. For legal matters, please consult a licensed attorney in your jurisdiction.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            
            {/* Section 1: Introduction */}
            <section className="mb-8">
              <h2 id="introduction" className="text-2xl font-semibold text-foreground mb-4">
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Letter of Dispute ("we," "us," or "our") operates the letterofdispute.com website and provides 
                dispute letter templates and related services. This Legal Disclaimer explains the nature of 
                our services and the limitations of the information we provide. By using our website or services, 
                you acknowledge that you have read, understood, and agree to be bound by this disclaimer.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong className="text-foreground">Letter of Dispute is not a law firm.</strong> We are a technology 
                company that provides AI-generated self-help letter templates designed to assist consumers in communicating 
                with businesses and organizations regarding disputes.
              </p>
            </section>

            {/* Section 2: AI-Generated Content */}
            <section className="mb-8">
              <h2 id="ai-disclosure" className="text-2xl font-semibold text-foreground mb-4">
                2. AI-Generated Content
              </h2>
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="pt-6">
                  <p className="text-amber-900 dark:text-amber-100 font-semibold mb-4">
                    Our letter templates are generated using artificial intelligence (AI) technology.
                  </p>
                  <ul className="list-disc pl-6 text-amber-800 dark:text-amber-200 space-y-2">
                    <li><strong>AI Generation:</strong> Letter content is created by AI systems based on template structures and user inputs.</li>
                    <li><strong>Editorial Oversight:</strong> Our editorial team reviews template frameworks for quality and consistency, but does NOT provide legal review.</li>
                    <li><strong>No Attorney Review:</strong> Individual letters are NOT reviewed by licensed attorneys or legal professionals.</li>
                    <li><strong>User Responsibility:</strong> You must review, verify, and customize all AI-generated content before use.</li>
                    <li><strong>Potential Inaccuracies:</strong> AI-generated content may contain errors, outdated information, or content inappropriate for your specific situation.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Section 3: No Government Affiliation */}
            <section className="mb-8">
              <h2 id="no-affiliation" className="text-2xl font-semibold text-foreground mb-4">
                3. No Government Affiliation
              </h2>
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-foreground font-semibold mb-4">
                    LETTER OF DISPUTE IS AN INDEPENDENT, PRIVATELY-OWNED SERVICE.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    We are NOT affiliated with, endorsed by, sponsored by, or connected to any government agency, regulatory body, 
                    or official institution, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>The Federal Trade Commission (FTC)</li>
                    <li>The Consumer Financial Protection Bureau (CFPB)</li>
                    <li>State Attorneys General offices</li>
                    <li>Local, state, federal, or international government agencies</li>
                    <li>Consumer protection agencies or ombudsman services</li>
                    <li>Any regulatory authority or official body</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    <strong className="text-foreground">Informational References Only:</strong> Any references to laws, regulations, 
                    consumer rights, or government agencies within our Service, templates, or educational content are for 
                    <strong> informational purposes only</strong>. These references should not be interpreted as an official 
                    endorsement, affiliation, or recommendation from those entities.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    We do not represent, act on behalf of, or have any official relationship with any government body, 
                    regulatory authority, or the companies/institutions mentioned in our templates.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Section 4: No Legal Advice */}
            <section className="mb-8">
              <h2 id="no-legal-advice" className="text-2xl font-semibold text-foreground mb-4">
                4. No Legal Advice
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The information provided on this website, including all letter templates, guides, articles, 
                and other content, is for <strong className="text-foreground">general informational and educational 
                purposes only</strong>. This information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Does not constitute legal advice</li>
                <li>Is not intended to be a substitute for professional legal counsel</li>
                <li>Should not be relied upon as legal guidance for your specific situation</li>
                <li>May not reflect the most current legal developments</li>
                <li>Is not tailored to any individual's particular circumstances</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                The transmission or receipt of information from this website does not create an attorney-client 
                or any other professional relationship between you and Letter of Dispute.
              </p>
            </section>

            {/* Section 5: No Attorney-Client Relationship */}
            <section className="mb-8">
              <h2 id="no-attorney-client" className="text-2xl font-semibold text-foreground mb-4">
                5. No Attorney-Client Relationship
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of this website and our services does <strong className="text-foreground">not create 
                an attorney-client relationship</strong> between you and Letter of Dispute, its owners, employees, 
                agents, or affiliates. We are not licensed attorneys and are not authorized to practice law 
                in any jurisdiction.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                No confidential or privileged relationship exists between you and Letter of Dispute. Any information 
                you provide to us is not protected by attorney-client privilege. We do not owe you any duty 
                of confidentiality beyond what is described in our Privacy Policy.
              </p>
            </section>

            {/* Section 6: No Guarantee of Outcomes */}
            <section className="mb-8">
              <h2 id="no-guarantees" className="text-2xl font-semibold text-foreground mb-4">
                6. No Guarantee of Outcomes
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We make <strong className="text-foreground">no representations, warranties, or guarantees</strong> regarding 
                the effectiveness or outcome of using our letter templates or services. Specifically:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>We cannot guarantee that sending a dispute letter will resolve your issue</li>
                <li>We cannot predict how the recipient will respond to your letter</li>
                <li>We cannot guarantee any refund, compensation, or other relief</li>
                <li>Past results or testimonials do not guarantee future outcomes</li>
                <li>The success of any dispute depends on many factors beyond our control</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Each situation is unique, and results will vary based on the specific facts, applicable laws, 
                the recipient's policies, and many other factors.
              </p>
            </section>

            {/* Section 7: User Responsibility */}
            <section className="mb-8">
              <h2 id="user-responsibility" className="text-2xl font-semibold text-foreground mb-4">
                7. User Responsibility
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Determining whether our templates are appropriate for your situation</li>
                <li>The accuracy and truthfulness of information you include in letters</li>
                <li>Reviewing and customizing templates to fit your specific circumstances</li>
                <li>Verifying all AI-generated content before sending</li>
                <li>Understanding and complying with applicable laws in your jurisdiction</li>
                <li>Deciding whether to seek professional legal advice</li>
                <li>Any consequences resulting from sending letters created using our templates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using our services, you acknowledge that you are acting on your own behalf and taking 
                full responsibility for your actions and their consequences.
              </p>
            </section>

            {/* Section 8: Jurisdiction Variations */}
            <section className="mb-8">
              <h2 id="jurisdiction" className="text-2xl font-semibold text-foreground mb-4">
                8. Jurisdiction Variations
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Laws, regulations, and legal procedures vary significantly between different:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Countries and territories</li>
                <li>States, provinces, and regions</li>
                <li>Local municipalities</li>
                <li>Industry sectors and regulatory bodies</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our templates are designed for general use and <strong className="text-foreground">may not comply 
                with or be appropriate for all jurisdictions</strong>. What works in one location may not work, 
                or may even be counterproductive, in another. It is your responsibility to ensure that any 
                letter you send complies with the laws and regulations of your specific jurisdiction.
              </p>
            </section>

            {/* Section 9: Third-Party Information */}
            <section className="mb-8">
              <h2 id="third-party" className="text-2xl font-semibold text-foreground mb-4">
                9. Third-Party Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain references to or information about third-party laws, regulations, 
                agencies, organizations, or services. We do not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Guarantee the accuracy or completeness of third-party information</li>
                <li>Endorse or recommend any third-party services or organizations</li>
                <li>Control the content or availability of third-party resources</li>
                <li>Accept responsibility for any actions taken based on third-party information</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Any references to laws, regulations, or consumer rights are for informational purposes only 
                and should be verified independently through official sources.
              </p>
            </section>

            {/* Section 10: When to Seek Legal Help - Highlighted */}
            <section className="mb-8">
              <h2 id="seek-legal-help" className="text-2xl font-semibold text-foreground mb-4">
                10. When to Seek Legal Help
              </h2>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground font-medium mb-3">
                        We strongly recommend consulting with a licensed attorney if:
                      </p>
                      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                        <li>You are involved in or anticipate court proceedings or litigation</li>
                        <li>Your dispute involves potential criminal matters</li>
                        <li>You are dealing with complex contract disputes</li>
                        <li>Your matter involves real estate transactions or property rights</li>
                        <li>You face employment law issues beyond simple workplace complaints</li>
                        <li>You have received legal threats or have been served with a lawsuit</li>
                        <li>Significant amounts of money are at stake</li>
                        <li>Your rights or freedoms could be significantly affected</li>
                        <li>You are unsure about the legal implications of your situation</li>
                        <li>Time limits or statutes of limitations may apply</li>
                      </ul>
                      <p className="text-muted-foreground mt-4">
                        Many attorneys offer free initial consultations. You can find licensed attorneys 
                        through your local bar association or legal aid organizations if cost is a concern.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 11: Limitation of Liability */}
            <section className="mb-8">
              <h2 id="limitation-liability" className="text-2xl font-semibold text-foreground mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by applicable law, Letter of Dispute and its owners, officers, 
                directors, employees, agents, and affiliates shall not be liable for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Any direct, indirect, incidental, special, consequential, or punitive damages</li>
                <li>Any loss of profits, data, use, goodwill, or other intangible losses</li>
                <li>Any damages resulting from your use or inability to use our services</li>
                <li>Any damages resulting from reliance on information provided on this website</li>
                <li>Any damages resulting from the outcome of using our letter templates</li>
                <li>Any actions taken or not taken by recipients of letters you send</li>
                <li>Any errors, inaccuracies, or omissions in AI-generated content</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This limitation of liability applies regardless of the legal theory under which damages 
                are sought, including but not limited to contract, tort (including negligence), strict 
                liability, or any other basis.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                In jurisdictions that do not allow the exclusion or limitation of certain damages, our 
                liability shall be limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* Section 12: Contact Information */}
            <section className="mb-8">
              <h2 id="contact" className="text-2xl font-semibold text-foreground mb-4">
                12. Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                If you have any questions about this Legal Disclaimer or our services, please contact us:
              </p>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a 
                        href="mailto:legal@letterofdispute.com" 
                        className="text-primary hover:underline"
                      >
                        legal@letterofdispute.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Acceptance Notice */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-muted-foreground text-sm">
                By using our website and services, you acknowledge that you have read, understood, and 
                agree to be bound by this Legal Disclaimer. If you do not agree with any part of this 
                disclaimer, please do not use our website or services.
              </p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DisclaimerPage;
