import { Link } from 'react-router-dom';
import TrustBadgesStrip from '@/components/shared/TrustBadgesStrip';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const Footer = () => {
  const { openSettings } = useCookieConsent();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container-wide py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/ld-logo.svg" 
                alt="Letter of Dispute" 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Professional dispute and complaint letters for everyday consumer situations.
            </p>
          </div>

          {/* Letter Types */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Letter Types</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/templates/refunds" className="text-muted-foreground hover:text-foreground transition-colors">
                  Refund Request Letters
                </Link>
              </li>
              <li>
                <Link to="/templates/housing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Landlord Repair Letters
                </Link>
              </li>
              <li>
                <Link to="/templates/damaged-goods" className="text-muted-foreground hover:text-foreground transition-colors">
                  Damaged Goods Complaints
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Free Tools */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Free Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/small-claims" className="text-muted-foreground hover:text-foreground transition-colors">
                  Small Claims Court Guide
                </Link>
              </li>
              <li>
                <Link to="/state-rights" className="text-muted-foreground hover:text-foreground transition-colors">
                  State Rights Lookup
                </Link>
              </li>
              <li>
                <Link to="/deadlines" className="text-muted-foreground hover:text-foreground transition-colors">
                  Deadlines Calculator
                </Link>
              </li>
              <li>
                <Link to="/analyze-letter" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analyze My Letter
                </Link>
              </li>
              <li>
                <Link to="/consumer-news" className="text-muted-foreground hover:text-foreground transition-colors">
                  Consumer News
                </Link>
              </li>
            </ul>
          </div>

          {/* State Laws */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">State Laws</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/state-rights/california" className="text-muted-foreground hover:text-foreground transition-colors">
                  California Consumer Rights
                </Link>
              </li>
              <li>
                <Link to="/state-rights/texas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Texas Consumer Rights
                </Link>
              </li>
              <li>
                <Link to="/state-rights/new-york" className="text-muted-foreground hover:text-foreground transition-colors">
                  New York Consumer Rights
                </Link>
              </li>
              <li>
                <Link to="/state-rights/florida" className="text-muted-foreground hover:text-foreground transition-colors">
                  Florida Consumer Rights
                </Link>
              </li>
              <li>
                <Link to="/state-rights/california/vehicle" className="text-muted-foreground hover:text-foreground transition-colors">
                  CA Lemon Law Rights
                </Link>
              </li>
              <li>
                <Link to="/state-rights/texas/housing" className="text-muted-foreground hover:text-foreground transition-colors">
                  TX Housing Rights
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Legal Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <button
                  onClick={openSettings}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-border">
          <TrustBadgesStrip variant="footer" className="mb-8" />
        </div>

        {/* Disclaimer */}
        <div className="pt-6 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Important:</strong> Letters are generated using AI technology with editorial oversight. 
              Letter of Dispute is an independent service with no affiliation with any government agency, 
              regulatory body, or the institutions mentioned in our content. We are not a law firm and do not 
              provide legal advice. All templates are provided "as is" without guarantee of any outcome. 
              For legal matters, please consult a licensed attorney in your jurisdiction.
            </p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Letter of Dispute. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
