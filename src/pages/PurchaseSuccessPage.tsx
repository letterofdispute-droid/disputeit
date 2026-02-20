import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, FileText, Edit, Loader2, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackPurchaseComplete, trackDownloadPdf } from '@/hooks/useGTM';
import { useAnalytics } from '@/hooks/useAnalytics';
import ResolutionPlanPanel from '@/components/letter/ResolutionPlanPanel';
import { useAuth } from '@/hooks/useAuth';

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
  const [voteSubmitted, setVoteSubmitted] = useState<'positive' | 'negative' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const purchaseTrackedRef = useRef(false);
  const trackerCreatedRef = useRef(false);
  const { trackCheckoutCompleted } = useAnalytics();
  const { user } = useAuth();

  // Read resolution context stored by LetterGenerator after generation
  const resolutionCategory = sessionStorage.getItem('resolution_category') || '';
  const resolutionState = sessionStorage.getItem('resolution_state') || undefined;

  const sessionId = searchParams.get('session_id');
  const purchaseId = searchParams.get('purchase_id');

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!purchaseId) {
        setError('Missing purchase information');
        setIsLoading(false);
        return;
      }

      try {
        if (!sessionId) {
          const { data: purchaseData, error: fetchError } = await supabase
            .from('letter_purchases')
            .select('*')
            .eq('id', purchaseId)
            .single();

          if (fetchError || !purchaseData) throw new Error('Purchase not found');
          if (purchaseData.amount_cents !== 0) {
            setError('Invalid purchase - please contact support');
            setIsLoading(false);
            return;
          }

          let signedPdfUrl: string | null = null;
          const storedPath = purchaseData.pdf_url;
          if (storedPath) {
            if (!storedPath.startsWith('http')) {
              const { data: signedData } = await supabase.storage.from('letters').createSignedUrl(storedPath, 3600);
              signedPdfUrl = signedData?.signedUrl || null;
            } else {
              signedPdfUrl = storedPath;
            }
          }

          setPurchase({
            id: purchaseData.id,
            templateName: purchaseData.template_name,
            purchaseType: purchaseData.purchase_type,
            letterContent: purchaseData.letter_content,
            pdfUrl: signedPdfUrl || undefined,
            editExpiresAt: purchaseData.edit_expires_at || undefined,
          });

          if (!purchaseTrackedRef.current) {
            purchaseTrackedRef.current = true;
            trackPurchaseComplete(purchaseData.template_slug || 'unknown', 'unknown', purchaseData.purchase_type, 0);
            trackCheckoutCompleted(purchaseData.template_slug || 'unknown', purchaseData.purchase_type, 0);
          }
        } else {
          const { data, error: fnError } = await supabase.functions.invoke('verify-letter-purchase', {
            body: { sessionId, purchaseId },
          });
          if (fnError) throw fnError;
          if (data?.success && data?.purchase) {
            setPurchase(data.purchase);
            if (!purchaseTrackedRef.current) {
              purchaseTrackedRef.current = true;
              const price = data.purchase.purchaseType === 'pdf-editable' ? 14.99 : 9.99;
              trackPurchaseComplete(data.purchase.templateSlug || 'unknown', 'unknown', data.purchase.purchaseType, price);
              trackCheckoutCompleted(data.purchase.templateSlug || 'unknown', data.purchase.purchaseType, price * 100);
            }
          } else {
            setError(data?.error || 'Payment verification failed');
          }
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

  // Auto-create a Dispute Tracker entry once the purchase is confirmed and the user is logged in
  useEffect(() => {
    if (!purchase || !user || trackerCreatedRef.current) return;
    trackerCreatedRef.current = true;

    const category = resolutionCategory || sessionStorage.getItem('resolution_category') || '';
    const title = `${purchase.templateName} Dispute`;

    supabase
      .from('dispute_outcomes')
      .insert({
        user_id: user.id,
        title,
        category: category || undefined,
        status: 'in_progress',
        resolution_steps: [],
      })
      .then(({ error }) => {
        if (error) console.error('Failed to auto-create dispute tracker entry:', error);
      });
  }, [purchase, user]);

  const downloadPdf = () => {
    if (!purchase?.pdfUrl) return;
    trackDownloadPdf(purchase.templateName.replace(/\s+/g, '-').toLowerCase());
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
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Verifying Your Purchase...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Something Went Wrong</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild><Link to="/">Return Home</Link></Button>
                <Button variant="accent" asChild><Link to="/contact">Contact Support</Link></Button>
              </div>
            </Card>
          ) : purchase ? (
            <>
              <Card className="p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Purchase Successful!</h1>
                  <p className="text-muted-foreground">Your letter is ready</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h2 className="font-semibold text-foreground mb-1">{purchase.templateName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {purchase.purchaseType === 'pdf-editable' ? 'PDF + 30 Days Edit Access' : 'PDF Only'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={downloadPdf} disabled={!purchase.pdfUrl}>
                    <FileText className="h-4 w-4 mr-2" />Download PDF
                  </Button>
                  {purchase.purchaseType === 'pdf-editable' && (
                    <Button className="w-full" variant="accent" asChild>
                      <Link to={`/letters/${purchase.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />Edit Your Letter
                      </Link>
                    </Button>
                  )}
                </div>

                {purchase.purchaseType === 'pdf-editable' && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      You have <span className="font-medium text-foreground">30 days</span> to edit your letter
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
                  {voteSubmitted ? (
                    <p className="text-sm text-muted-foreground">Thanks for your feedback! {voteSubmitted === 'positive' ? '👍' : '👎'}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground mb-3">Did this letter meet your expectations?</p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm" disabled={isVoting}
                          onClick={async () => {
                            setIsVoting(true);
                            try {
                              await supabase.rpc('submit_template_vote' as any, { p_slug: purchase.templateName.replace(/\s+/g, '-').toLowerCase(), p_positive: true, p_purchase_id: purchase.id });
                              setVoteSubmitted('positive');
                            } catch (e) { console.error(e); }
                            setIsVoting(false);
                          }}>
                          <ThumbsUp className="h-4 w-4 mr-1.5" />Yes
                        </Button>
                        <Button variant="outline" size="sm" disabled={isVoting}
                          onClick={async () => {
                            setIsVoting(true);
                            try {
                              await supabase.rpc('submit_template_vote' as any, { p_slug: purchase.templateName.replace(/\s+/g, '-').toLowerCase(), p_positive: false, p_purchase_id: purchase.id });
                              setVoteSubmitted('negative');
                            } catch (e) { console.error(e); }
                            setIsVoting(false);
                          }}>
                          <ThumbsDown className="h-4 w-4 mr-1.5" />No
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground mb-4">A copy has also been sent to your email address.</p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="ghost" asChild><Link to="/">Create Another Letter</Link></Button>
                    <Button variant="ghost" asChild><Link to="/dashboard">View My Letters</Link></Button>
                  </div>
                </div>
              </Card>

              {/* Resolution Plan — persisted from LetterGenerator via sessionStorage */}
              {resolutionCategory && (
                <div className="mt-6">
                  <ResolutionPlanPanel
                    templateCategory={resolutionCategory}
                    selectedState={resolutionState}
                    compact={false}
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default PurchaseSuccessPage;
