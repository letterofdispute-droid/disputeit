import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Download, FileText, Edit, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackPurchaseComplete, trackDownloadPdf } from '@/hooks/useGTM';

interface PurchaseData {
  id: string;
  templateName: string;
  purchaseType: string;
  letterContent: string;
  pdfUrl?: string;
  editExpiresAt?: string;
}

const PurchaseSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const purchaseTrackedRef = useRef(false);

  const sessionId = searchParams.get('session_id');
  const purchaseId = searchParams.get('purchase_id');

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!sessionId || !purchaseId) {
        setError('Missing purchase information');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('verify-letter-purchase', {
          body: { sessionId, purchaseId },
        });

        if (fnError) throw fnError;

        if (data?.success && data?.purchase) {
          setPurchase(data.purchase);
          // Track purchase complete only once
          if (!purchaseTrackedRef.current) {
            purchaseTrackedRef.current = true;
            const price = data.purchase.purchaseType === 'pdf-editable' ? 14.99 : 9.99;
            trackPurchaseComplete(
              data.purchase.templateSlug || 'unknown',
              'unknown', // category not available in purchase data
              data.purchase.purchaseType,
              price
            );
          }
        } else {
          setError(data?.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify purchase. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPurchase();
  }, [sessionId, purchaseId]);

  const downloadPdf = () => {
    if (!purchase?.pdfUrl) return;
    
    trackDownloadPdf(purchase.templateName.replace(/\s+/g, '-').toLowerCase());
    
    // Open the signed URL in a new tab to download
    const link = document.createElement('a');
    link.href = purchase.pdfUrl;
    link.download = `${purchase.templateName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <SEOHead 
        title="Purchase Successful | Letter of Dispute"
        description="Your letter purchase was successful. Download your documents."
        canonicalPath="/purchase-success"
      />

      <div className="min-h-[60vh] py-16 md:py-24 bg-background">
        <div className="container-wide max-w-2xl">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                Verifying Your Purchase...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/">Return Home</Link>
                </Button>
                <Button variant="accent" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </Card>
          ) : purchase ? (
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Purchase Successful!
                </h1>
                <p className="text-muted-foreground">
                  Your letter is ready
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h2 className="font-semibold text-foreground mb-1">
                  {purchase.templateName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {purchase.purchaseType === 'pdf-editable' 
                    ? 'PDF + 30 Days Edit Access' 
                    : 'PDF Only'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={downloadPdf}
                  disabled={!purchase.pdfUrl}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>

                {purchase.purchaseType === 'pdf-editable' && (
                  <Button 
                    className="w-full" 
                    variant="accent"
                    asChild
                  >
                    <Link to={`/letters/${purchase.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Your Letter
                    </Link>
                  </Button>
                )}
              </div>

              {purchase.purchaseType === 'pdf-editable' && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    You have <span className="font-medium text-foreground">30 days</span> to edit your letter in our online editor
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  A copy has also been sent to your email address.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="ghost" asChild>
                    <Link to="/">Create Another Letter</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/dashboard">View My Letters</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default PurchaseSuccessPage;
