import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Separator } from '@/components/ui/separator';

const TermsPage = () => {
  const lastUpdated = "February 1, 2026";

  return (
    <Layout>
      <SEOHead
        title="Terms of Service | DisputeLetters"
        description="Read the Terms of Service for DisputeLetters. Understand your rights and responsibilities when using our dispute letter generation service."
        canonicalPath="/terms"
        type="website"
      />

      <div className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          <Separator className="mb-8" />

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to DisputeLetters ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website at disputeletters.com and our letter generation services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By creating an account, purchasing a letter, or otherwise using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 18 years old to use our Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website with a new "Last Updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DisputeLetters provides a platform for generating professional dispute and complaint letters. Our Service includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access to letter templates for various dispute categories</li>
                <li>A letter generation tool that creates personalized letters based on your input</li>
                <li>Downloadable letter documents in PDF and DOCX formats</li>
                <li>Educational content about consumer rights and dispute resolution</li>
              </ul>
            </section>

            {/* Important Disclaimer */}
            <section className="bg-muted/50 rounded-lg p-6 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Important Legal Disclaimer — "As Is" Use</h2>
              <div className="text-muted-foreground space-y-4">
                <p className="font-semibold text-foreground">
                  DISPUTELETTERS IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL ADVICE.
                </p>
                <p>
                  The letters, templates, and information provided through our Service are for informational and educational purposes only. They do not constitute legal advice, and no attorney-client relationship is created by your use of the Service.
                </p>
                <p className="font-semibold text-foreground">
                  ALL TEMPLATES AND LETTERS ARE PROVIDED "AS IS" AND ARE USED AT YOUR OWN RISK.
                </p>
                <p>
                  By purchasing or using any letter template from our Service, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Templates are guidelines only:</strong> Our letters serve as starting points and general guidance for your communications. They are not tailored to your specific legal situation or jurisdiction.</li>
                  <li><strong>You assume all responsibility:</strong> You are solely responsible for reviewing, customizing, and sending any letter generated through our Service. The outcome and consequences of using our templates are entirely your responsibility.</li>
                  <li><strong>No guaranteed outcomes:</strong> We make no representations or warranties that using our templates will result in any particular outcome, resolution, refund, or response from the recipient.</li>
                  <li><strong>No liability accepted:</strong> DisputeLetters, its owners, employees, and affiliates shall not be held liable for any damages, losses, or negative consequences arising from your use of our templates.</li>
                  <li>Are not reviewed by attorneys for your specific situation</li>
                  <li>Should not be relied upon as a substitute for professional legal counsel</li>
                  <li>May not be appropriate for all situations or jurisdictions</li>
                </ul>
                <p>
                  If you have a legal matter requiring professional advice, we strongly recommend consulting with a licensed attorney in your jurisdiction.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access certain features of our Service, you may need to create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that violate these Terms or that we believe pose a security risk.
              </p>
            </section>

            {/* Purchases and Payments */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Purchases and Payments</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service offers letter generation on a per-letter basis. By making a purchase, you agree to the following:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Pricing:</strong> All prices are displayed in US dollars and are subject to change. The price shown at checkout is the final price you will pay.</li>
                <li><strong>Payment:</strong> We use Stripe for secure payment processing. By providing payment information, you represent that you are authorized to use the payment method.</li>
                <li><strong>Delivery:</strong> Upon successful payment, you will receive immediate access to download your generated letter in PDF and DOCX formats.</li>
                <li><strong>No Recurring Charges:</strong> Unless you purchase a subscription, each purchase is a one-time transaction.</li>
              </ul>
            </section>

            {/* Refund Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Refund Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We offer a 30-day money-back guarantee on all letter purchases. If you are not satisfied with your purchase, you may request a refund within 30 days of purchase by contacting us at support@disputeletters.com.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Please note that refunds are provided at our discretion and may be denied in cases of abuse or if we determine the Service was used as intended. Once a refund is processed, your access to the purchased letter may be revoked.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All content on our website, including text, graphics, logos, templates, and software, is the property of DisputeLetters or our licensors and is protected by copyright and other intellectual property laws.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you purchase a letter through our Service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>You receive a personal, non-exclusive license to use the generated letter for your own dispute resolution purposes</li>
                <li>You may not resell, redistribute, or commercially exploit our templates or generated letters</li>
                <li>You may not copy or reproduce our templates for use outside of our Service</li>
              </ul>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use our Service to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Create fraudulent, false, or misleading letters or claims</li>
                <li>Harass, threaten, or intimidate any person or organization</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit viruses, malware, or other harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of our Service</li>
                <li>Scrape, copy, or reproduce our content without authorization</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, DISPUTELETTERS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Any outcomes or results from disputes you pursue using our letters</li>
                <li>Actions taken by third parties in response to letters you send</li>
                <li>Errors or omissions in our templates or generated content</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Disclaimer of Warranties</h2>
              <div className="text-muted-foreground space-y-4">
                <p className="leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
                </p>
                <p className="leading-relaxed font-semibold">
                  ALL LETTER TEMPLATES AND GENERATED CONTENT ARE PROVIDED "AS IS" WITHOUT ANY WARRANTY OF EFFECTIVENESS OR SUITABILITY. YOU EXPRESSLY AGREE THAT YOUR USE OF OUR TEMPLATES IS AT YOUR SOLE RISK.
                </p>
                <p className="leading-relaxed">
                  We do not guarantee that any letter will achieve your desired result, and we expressly disclaim any liability for the outcome of disputes you pursue using our templates. Results may vary based on your specific circumstances, the recipient's policies, applicable laws, and many other factors outside our control.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless DisputeLetters and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your violation of these Terms, or your violation of any rights of another.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Governing Law and Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, with arbitration taking place in Delaware.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy and any other legal notices published on our website, constitute the entire agreement between you and DisputeLetters regarding your use of the Service and supersede any prior agreements.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 text-muted-foreground">
                <p><strong>DisputeLetters</strong></p>
                <p>Email: legal@disputeletters.com</p>
                <p>Website: disputeletters.com/contact</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
