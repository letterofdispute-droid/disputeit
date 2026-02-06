import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-wide py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/ld-logo.svg" 
                alt="DisputeLetters" 
                className="h-9" 
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
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Important Disclaimer:</strong> This service provides letter templates and does not constitute legal advice. 
              The letters generated are not reviewed by legal professionals and do not guarantee any specific outcome. 
              For legal matters, please consult a qualified attorney in your jurisdiction.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              All content on this site is reviewed and moderated by our editorial team.
            </p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} DisputeLetters. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
