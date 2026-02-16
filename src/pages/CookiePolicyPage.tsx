import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Cookie, Shield, BarChart3, Type, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CookiePolicyPage = () => {
  const lastUpdated = 'February 16, 2026';
  const { openSettings } = useCookieConsent();

  const tableOfContents = [
    { id: 'what-are-cookies', title: '1. What Are Cookies?' },
    { id: 'how-we-use', title: '2. How We Use Cookies' },
    { id: 'essential', title: '3. Essential Cookies' },
    { id: 'analytics', title: '4. Analytics Cookies' },
    { id: 'functional', title: '5. Functional Cookies' },
    { id: 'third-party', title: '6. Third-Party Services' },
    { id: 'retention', title: '7. Cookie Retention Periods' },
    { id: 'manage', title: '8. Managing Your Preferences' },
    { id: 'changes', title: '9. Changes to This Policy' },
    { id: 'contact', title: '10. Contact Us' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Cookie Policy | Letter of Dispute"
        description="Learn how Letter of Dispute uses cookies and similar technologies. Understand what cookies we use, why, and how to manage your preferences."
        canonicalPath="/cookie-policy"
        type="website"
      />

      <div className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Cookie Policy</h1>
            </div>
            <p className="text-muted-foreground">Last Updated: {lastUpdated}</p>
          </div>

          {/* Quick action */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Want to change your cookie preferences?</p>
              <p className="text-xs text-muted-foreground mt-1">You can update your choices at any time.</p>
            </div>
            <Button size="sm" onClick={openSettings}>
              Manage Cookie Settings
            </Button>
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
            <section id="what-are-cookies" className="scroll-mt-24">
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device (computer, tablet, or phone) when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience.
              </p>
              <p>
                We also use similar technologies such as <strong>localStorage</strong> (browser-based storage) and <strong>third-party scripts</strong> that may set their own cookies. This policy covers all of these technologies.
              </p>
            </section>

            {/* Section 2 */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2>2. How We Use Cookies</h2>
              <p>
                Letter of Dispute uses cookies and similar technologies grouped into three categories. We only activate non-essential cookies <strong>after you give explicit consent</strong> through our cookie banner, in compliance with GDPR (EU) and UK ePrivacy regulations.
              </p>
              <p>The three categories are:</p>
              <ul>
                <li><strong>Essential</strong> — Required for the site to function correctly</li>
                <li><strong>Analytics</strong> — Help us understand how visitors use the site</li>
                <li><strong>Functional</strong> — Enhance the visual experience and typography</li>
              </ul>
            </section>

            {/* Section 3 – Essential */}
            <section id="essential" className="scroll-mt-24">
              <h2>3. Essential Cookies</h2>
              <div className="not-prose bg-muted/50 border border-border rounded-lg p-6 my-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Always Active</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These cookies are strictly necessary for the website to function. They cannot be disabled.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Name</th>
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Purpose</th>
                        <th className="text-left py-2 font-medium text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                        <td className="py-2 pr-4">Authentication session token. Keeps you logged in securely.</td>
                        <td className="py-2">Session / 7 days</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">cookie_consent</td>
                        <td className="py-2 pr-4">Stores your cookie consent preferences (localStorage).</td>
                        <td className="py-2">Persistent (until cleared)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">analytics_session_id</td>
                        <td className="py-2 pr-4">Anonymous session identifier for first-party analytics (sessionStorage).</td>
                        <td className="py-2">Browser session</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">first_touch_attribution</td>
                        <td className="py-2 pr-4">Records how you first found the site (localStorage).</td>
                        <td className="py-2">Persistent (until cleared)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 4 – Analytics */}
            <section id="analytics" className="scroll-mt-24">
              <h2>4. Analytics Cookies</h2>
              <div className="not-prose bg-muted/50 border border-border rounded-lg p-6 my-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Requires Consent</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These cookies help us understand how you interact with the site so we can improve it. They are only loaded after you grant consent.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Service</th>
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Cookies / Technologies</th>
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Purpose</th>
                        <th className="text-left py-2 font-medium text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-foreground">Google Tag Manager</td>
                        <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*, _gid</td>
                        <td className="py-2 pr-4">Manages analytics tags, tracks page views, and measures conversion funnels.</td>
                        <td className="py-2">Up to 2 years</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-foreground">Google Analytics 4</td>
                        <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*</td>
                        <td className="py-2 pr-4">Collects anonymised statistics about page views, sessions, and user behaviour.</td>
                        <td className="py-2">14 months</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium text-foreground">reCAPTCHA Enterprise</td>
                        <td className="py-2 pr-4 font-mono text-xs">_GRECAPTCHA</td>
                        <td className="py-2 pr-4">Protects login, signup, and contact forms from automated abuse.</td>
                        <td className="py-2">6 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p>
                When you reject analytics cookies, Google Tag Manager is never loaded and reCAPTCHA is skipped gracefully (forms remain functional). Our own first-party analytics inserts are also suppressed.
              </p>
            </section>

            {/* Section 5 – Functional */}
            <section id="functional" className="scroll-mt-24">
              <h2>5. Functional Cookies</h2>
              <div className="not-prose bg-muted/50 border border-border rounded-lg p-6 my-6">
                <div className="flex items-center gap-2 mb-4">
                  <Type className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Requires Consent</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These technologies enhance the look and feel of the site but are not required for core functionality.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Service</th>
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Technology</th>
                        <th className="text-left py-2 pr-4 font-medium text-foreground">Purpose</th>
                        <th className="text-left py-2 font-medium text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="py-2 pr-4 font-medium text-foreground">Google Fonts</td>
                        <td className="py-2 pr-4">CDN stylesheet</td>
                        <td className="py-2 pr-4">Loads the Inter and Lora typefaces from Google's CDN for consistent typography.</td>
                        <td className="py-2">Session (no cookie set; stylesheet reference only)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p>
                If you reject functional cookies, the Google Fonts stylesheet is removed and the site falls back to system fonts (system-ui for body text, Georgia for headings). The site remains fully usable.
              </p>
            </section>

            {/* Section 6 – Third-Party Services */}
            <section id="third-party" className="scroll-mt-24">
              <h2>6. Third-Party Services</h2>
              <p>The following third-party services may set cookies or collect data when you use our site:</p>

              <h3>Google (Analytics & reCAPTCHA)</h3>
              <p>
                Google Tag Manager, Google Analytics 4, and reCAPTCHA Enterprise are provided by Google LLC. These services are only activated after you consent to analytics cookies. Google processes data in accordance with their{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy <ExternalLink className="inline h-3 w-3" />
                </a>.
              </p>
              <p>
                We use Google's <strong>Consent Mode v2</strong>, which means Google tags automatically respect your cookie preferences. When analytics cookies are denied, Google tags operate in a restricted, cookieless mode.
              </p>

              <h3>Stripe (Payments)</h3>
              <p>
                When you make a purchase, you are redirected to Stripe's secure payment page. Stripe may set its own cookies to prevent fraud and process payments. Stripe is PCI-DSS Level 1 compliant. See{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe's Privacy Policy <ExternalLink className="inline h-3 w-3" />
                </a>.
              </p>

              <h3>Google Fonts</h3>
              <p>
                When functional cookies are accepted, font files are loaded from Google's CDN (<code>fonts.googleapis.com</code> / <code>fonts.gstatic.com</code>). Google may log your IP address when serving these files. See{' '}
                <a href="https://developers.google.com/fonts/faq/privacy" target="_blank" rel="noopener noreferrer">
                  Google Fonts Privacy FAQ <ExternalLink className="inline h-3 w-3" />
                </a>.
              </p>
            </section>

            {/* Section 7 – Retention Periods */}
            <section id="retention" className="scroll-mt-24">
              <h2>7. Cookie Retention Periods</h2>
              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Cookie / Storage</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">cookie_consent</td>
                      <td className="py-2 px-4">localStorage</td>
                      <td className="py-2 px-4">Until manually cleared</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">sb-*-auth-token</td>
                      <td className="py-2 px-4">Cookie</td>
                      <td className="py-2 px-4">Session / 7 days</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">_ga / _ga_*</td>
                      <td className="py-2 px-4">Cookie</td>
                      <td className="py-2 px-4">2 years / 14 months</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">_gid</td>
                      <td className="py-2 px-4">Cookie</td>
                      <td className="py-2 px-4">24 hours</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">_GRECAPTCHA</td>
                      <td className="py-2 px-4">Cookie</td>
                      <td className="py-2 px-4">6 months</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">analytics_session_id</td>
                      <td className="py-2 px-4">sessionStorage</td>
                      <td className="py-2 px-4">Browser session</td>
                    </tr>
                    <tr className="border-t border-border/50">
                      <td className="py-2 px-4 font-mono text-xs">first_touch_attribution</td>
                      <td className="py-2 px-4">localStorage</td>
                      <td className="py-2 px-4">Until manually cleared</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 8 – Managing */}
            <section id="manage" className="scroll-mt-24">
              <h2>8. Managing Your Preferences</h2>
              <p>You have several ways to control cookies on our site:</p>
              <ul>
                <li>
                  <strong>Our Cookie Banner:</strong> When you first visit the site, a banner lets you accept all, reject all, or choose specific categories.
                </li>
                <li>
                  <strong>Cookie Settings Link:</strong> You can change your preferences at any time using the "Cookie Settings" link in the website footer, or by clicking the button at the top of this page.
                </li>
                <li>
                  <strong>Browser Settings:</strong> Most browsers let you block or delete cookies via their settings. Note that blocking essential cookies may prevent parts of the site from working correctly.
                </li>
              </ul>
              <p>
                For more information about managing cookies in your browser, visit{' '}
                <a href="https://www.aboutcookies.org/" target="_blank" rel="noopener noreferrer">
                  aboutcookies.org <ExternalLink className="inline h-3 w-3" />
                </a>.
              </p>
            </section>

            {/* Section 9 – Changes */}
            <section id="changes" className="scroll-mt-24">
              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for operational, legal, or regulatory reasons. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, re-display the cookie consent banner so you can review your choices.
              </p>
            </section>

            {/* Section 10 – Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2>10. Contact Us</h2>
              <p>
                If you have questions about our use of cookies or this policy, you can reach us at:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@letterofdispute.com">privacy@letterofdispute.com</a>
                </li>
                <li>
                  <strong>Contact Page:</strong>{' '}
                  <Link to="/contact">letterofdispute.com/contact</Link>
                </li>
              </ul>
              <p>
                For broader privacy questions, please refer to our{' '}
                <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CookiePolicyPage;
