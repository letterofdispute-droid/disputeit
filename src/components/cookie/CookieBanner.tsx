import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import CookiePreferencesModal from './CookiePreferencesModal';
import { Cookie } from 'lucide-react';

const CookieBanner = () => {
  const { hasConsented, acceptAll, rejectAll, openSettings } = useCookieConsent();

  return (
    <>
      <AnimatePresence>
        {!hasConsented && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 inset-x-0 z-[90] border-t border-border bg-card shadow-lg"
          >
            <div className="container-wide py-4 md:py-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Text */}
                <div className="flex-1 flex items-start gap-3">
                  <Cookie className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    We use cookies to improve your experience and analyse site traffic. Read our{' '}
                    <Link to="/cookie-policy" className="underline text-foreground hover:text-primary transition-colors">
                      Cookie Policy
                    </Link>.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={openSettings}
                    className="text-sm text-muted-foreground underline hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    Manage Preferences
                  </button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>
                    Reject All
                  </Button>
                  <Button size="sm" onClick={acceptAll}>
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookiePreferencesModal />
    </>
  );
};

export default CookieBanner;
