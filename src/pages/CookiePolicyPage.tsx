import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Cookie, Shield, BarChart3, Type, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CookiePolicyPage = () => {
  const lastUpdated = 'February 19, 2026';
  const { openSettings } = useCookieConsent();
  const [activeSection, setActiveSection] = useState('what-are-cookies');
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        title="Cookie Policy | Letter of Dispute"
        description="Learn how Letter of Dispute uses cookies and similar technologies. Understand what cookies we use, why, and how to manage your preferences."
        canonicalPath="/cookie-policy"
        type="website"
      />

      {/* Branded Header Banner */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Cookie className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">GDPR & UK ePrivacy Compliant</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-3">Cookie Policy</h1>
            <p className="text-primary-foreground/80 mb-4">
              We only activate non-essential cookies after you give explicit consent. Here's exactly what we use and why.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-primary-foreground/60">Last Updated: {lastUpdated}</span>
              <Button size="sm" onClick={openSettings} variant="outline"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                Manage Cookie Settings
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
            {/* Quick action banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">Want to change your cookie preferences?</p>
                <p className="text-xs text-muted-foreground mt-1">You can update your choices at any time — it takes effect immediately.</p>
              </div>
              <Button size="sm" onClick={openSettings} variant="accent">Manage Cookie Settings</Button>
            </div>

            {/* Mobile ToC */}
            <div className="md:hidden bg-muted/50 rounded-lg p-4 mb-8">
              <p className="text-sm font-semibold text-foreground mb-3">Table of Contents</p>
              <nav className="grid grid-cols-2 gap-1">
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="text-primary hover:underline text-xs">{item.title}</a>
                ))}
              </nav>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section id="what-are-cookies" className="scroll-mt-24">
                <h2>1. What Are Cookies?</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience.</p>
                <p>We also use similar technologies such as <strong>localStorage</strong> (browser-based storage) and <strong>third-party scripts</strong> that may set their own cookies. This policy covers all of these technologies.</p>
              </section>

              <section id="how-we-use" className="scroll-mt-24">
                <h2>2. How We Use Cookies</h2>
                <p>Letter of Dispute uses cookies grouped into three categories. We only activate non-essential cookies <strong>after you give explicit consent</strong>, in compliance with GDPR (EU) and UK ePrivacy regulations.</p>
                <p>The three categories are:</p>
                <ul>
                  <li><strong>Essential</strong> — Required for the site to function correctly</li>
                  <li><strong>Analytics</strong> — Help us understand how visitors use the site</li>
                  <li><strong>Functional</strong> — Enhance the visual experience and typography</li>
                </ul>
              </section>

              <section id="essential" className="scroll-mt-24">
                <h2>3. Essential Cookies</h2>
                <div className="not-prose bg-muted/50 border border-border rounded-xl p-6 my-6">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">Essential</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200">Always On</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">These cookies are strictly necessary for the website to function. They cannot be disabled.</p>
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
                          <td className="py-2">Persistent</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">analytics_session_id</td>
                          <td className="py-2 pr-4">Anonymous session identifier for first-party analytics (sessionStorage).</td>
                          <td className="py-2">Browser session</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">first_touch_attribution</td>
                          <td className="py-2 pr-4">Records how you first found the site (localStorage).</td>
                          <td className="py-2">Persistent</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section id="analytics" className="scroll-mt-24">
                <h2>4. Analytics Cookies</h2>
                <div className="not-prose bg-muted/50 border border-border rounded-xl p-6 my-6">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">Analytics</h3>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200">Requires Consent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">These cookies help us understand how you interact with the site. Only loaded after you grant consent.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Service</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Cookies</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Purpose</th>
                          <th className="text-left py-2 font-medium text-foreground">Retention</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">Google Tag Manager</td>
                          <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*, _gid</td>
                          <td className="py-2 pr-4">Manages analytics tags, tracks page views, measures conversion funnels.</td>
                          <td className="py-2">Up to 2 years</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">Google Analytics 4</td>
                          <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*</td>
                          <td className="py-2 pr-4">Collects anonymised statistics about page views and sessions.</td>
                          <td className="py-2">14 months</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-medium text-foreground">reCAPTCHA Enterprise</td>
                          <td className="py-2 pr-4 font-mono text-xs">_GRECAPTCHA</td>
                          <td className="py-2 pr-4">Protects forms from automated abuse.</td>
                          <td className="py-2">6 months</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p>When you reject analytics cookies, Google Tag Manager is never loaded and reCAPTCHA is skipped gracefully.</p>
              </section>

              <section id="functional" className="scroll-mt-24">
                <h2>5. Functional Cookies</h2>
                <div className="not-prose bg-muted/50 border border-border rounded-xl p-6 my-6">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">Functional</h3>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200">Requires Consent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">These technologies enhance the look and feel of the site but are not required for core functionality.</p>
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
                          <td className="py-2 pr-4">Loads Inter and Lora typefaces from Google's CDN for consistent typography.</td>
                          <td className="py-2">Session (no cookie set)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p>If you reject functional cookies, the site falls back to system fonts. The site remains fully usable.</p>
              </section>

              <section id="third-party" className="scroll-mt-24">
                <h2>6. Third-Party Services</h2>

                <h3>Google (Analytics & reCAPTCHA)</h3>
                <p>Google Tag Manager, Google Analytics 4, and reCAPTCHA Enterprise are only activated after you consent to analytics cookies. Google processes data in accordance with their{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy <ExternalLink className="inline h-3 w-3" />
                  </a>.
                </p>
                <p>We use Google's <strong>Consent Mode v2</strong>, which automatically respects your cookie preferences.</p>

                <h3>Stripe (Payments)</h3>
                <p>When you make a purchase, you are redirected to Stripe's secure payment page. Stripe may set its own cookies to prevent fraud. See{' '}
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                    Stripe's Privacy Policy <ExternalLink className="inline h-3 w-3" />
                  </a>.
                </p>

                <h3>Google Fonts</h3>
                <p>When functional cookies are accepted, font files are loaded from Google's CDN. Google may log your IP when serving these files. See{' '}
                  <a href="https://developers.google.com/fonts/faq/privacy" target="_blank" rel="noopener noreferrer">
                    Google Fonts Privacy FAQ <ExternalLink className="inline h-3 w-3" />
                  </a>.
                </p>
              </section>

              <section id="retention" className="scroll-mt-24">
                <h2>7. Cookie Retention Periods</h2>
                <div className="not-prose overflow-x-auto my-6">
                  <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Cookie / Storage</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {[
                        { name: 'cookie_consent', type: 'localStorage', ret: 'Until manually cleared' },
                        { name: 'sb-*-auth-token', type: 'Cookie', ret: 'Session / 7 days' },
                        { name: '_ga / _ga_*', type: 'Cookie', ret: '2 years / 14 months' },
                        { name: '_gid', type: 'Cookie', ret: '24 hours' },
                        { name: '_GRECAPTCHA', type: 'Cookie', ret: '6 months' },
                        { name: 'analytics_session_id', type: 'sessionStorage', ret: 'Browser session' },
                        { name: 'first_touch_attribution', type: 'localStorage', ret: 'Until manually cleared' },
                      ].map((row, i) => (
                        <tr key={row.name} className="border-t border-border/50">
                          <td className="py-2 px-4 font-mono text-xs">{row.name}</td>
                          <td className="py-2 px-4">{row.type}</td>
                          <td className="py-2 px-4">{row.ret}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="manage" className="scroll-mt-24">
                <h2>8. Managing Your Preferences</h2>
                <p>You have several ways to control cookies on our site:</p>
                <ul>
                  <li><strong>Our Cookie Banner:</strong> When you first visit the site, a banner lets you accept all, reject all, or choose specific categories.</li>
                  <li><strong>Cookie Settings Link:</strong> Change your preferences at any time using the "Cookie Settings" link in the website footer, or by clicking the button at the top of this page.</li>
                  <li><strong>Browser Settings:</strong> Most browsers let you block or delete cookies. Note that blocking essential cookies may prevent parts of the site from working correctly.</li>
                </ul>
                <p>For more information about managing cookies in your browser, visit{' '}
                  <a href="https://www.aboutcookies.org/" target="_blank" rel="noopener noreferrer">
                    aboutcookies.org <ExternalLink className="inline h-3 w-3" />
                  </a>.
                </p>
              </section>

              <section id="changes" className="scroll-mt-24">
                <h2>9. Changes to This Policy</h2>
                <p>We may update this Cookie Policy from time to time. When we make material changes, we will update the "Last Updated" date and, where appropriate, re-display the cookie consent banner so you can review your choices.</p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2>10. Contact Us</h2>
                <p>If you have questions about our use of cookies or this policy, you can reach us at:</p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:privacy@letterofdispute.com">privacy@letterofdispute.com</a></li>
                  <li><strong>Contact Page:</strong> <Link to="/contact">letterofdispute.com/contact</Link></li>
                </ul>
                <p>For broader privacy questions, please refer to our <Link to="/privacy">Privacy Policy</Link>.</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CookiePolicyPage;
