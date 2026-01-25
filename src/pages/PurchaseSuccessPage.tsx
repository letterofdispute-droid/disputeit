import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Download, FileText, FileEdit, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseData {
  id: string;
  templateName: string;
  purchaseType: string;
  letterContent: string;
  pdfUrl?: string;
  docxUrl?: string;
}

const PurchaseSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);

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

  const downloadAsPdf = () => {
    if (!purchase?.letterContent) return;
    
    // Create a simple text-based download for now
    // In production, you'd generate a proper PDF
    const blob = new Blob([purchase.letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${purchase.templateName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsDocx = () => {
    if (!purchase?.letterContent) return;
    
    // Create a simple text download
    // In production, you'd generate a proper DOCX
    const blob = new Blob([purchase.letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${purchase.templateName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <SEOHead 
        title="Purchase Successful | DisputeLetters"
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
                  Your letter is ready to download
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h2 className="font-semibold text-foreground mb-1">
                  {purchase.templateName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {purchase.purchaseType === 'pdf-editable' 
                    ? 'PDF + Editable Document' 
                    : 'PDF Only'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="accent"
                  onClick={downloadAsPdf}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>

                {purchase.purchaseType === 'pdf-editable' && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={downloadAsDocx}
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Download Editable Document
                  </Button>
                )}
              </div>

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
