import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import LetterEditor from '@/components/letter/LetterEditor';
import EditAccessBadge from '@/components/letter/EditAccessBadge';
import UnlockEditingModal from '@/components/letter/UnlockEditingModal';

interface PurchaseData {
  id: string;
  template_name: string;
  letter_content: string;
  last_edited_content: string | null;
  edit_expires_at: string | null;
  purchase_type: string;
  pdf_url: string | null;
}

const LetterEditorPage = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const hasEditAccess = purchase?.edit_expires_at 
    ? new Date(purchase.edit_expires_at) > new Date() 
    : false;

  // Check if returning from successful unlock
  useEffect(() => {
    if (searchParams.get('unlocked') === 'success') {
      toast({
        title: 'Editing Unlocked!',
        description: 'You now have 30 more days of editing access.',
      });
      // Refresh purchase data
      fetchPurchase();
    }
  }, [searchParams]);

  const fetchPurchase = useCallback(async () => {
    if (!purchaseId) return;

    try {
      const { data, error } = await supabase
        .from('letter_purchases')
        .select('id, template_name, letter_content, last_edited_content, edit_expires_at, purchase_type, pdf_url')
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Letter not found');
        return;
      }

      setPurchase(data);
      setContent(data.last_edited_content || data.letter_content);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load letter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    if (!authLoading) {
      fetchPurchase();
    }
  }, [authLoading, fetchPurchase]);

  // Auto-save every 30 seconds if content changed
  useEffect(() => {
    if (!hasEditAccess || !purchase) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (content !== (purchase.last_edited_content || purchase.letter_content)) {
        handleSave();
      }
    }, 30000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, hasEditAccess, purchase]);

  const handleSave = async () => {
    if (!purchaseId || !hasEditAccess) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('letter_purchases')
        .update({
          last_edited_content: content,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', purchaseId);

      if (error) throw error;

      setLastSavedAt(new Date());
      toast({
        title: 'Saved',
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: 'Save failed',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!purchaseId) return;

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-letter-pdf', {
        body: { purchaseId },
      });

      if (error) throw error;

      if (data?.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `${purchase?.template_name.replace(/\s+/g, '-').toLowerCase() || 'letter'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export started',
          description: 'Your PDF is being downloaded.',
        });
      } else {
        throw new Error('No download URL received');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Subtle branding component
  const BrandingBadge = () => (
    <div className="flex items-center justify-center gap-2 py-3 border-t border-border bg-muted/20">
      <img src="/ld-logo-icon.svg" alt="" className="h-4 w-4 opacity-50" />
      <span className="text-xs text-muted-foreground">Letter of Dispute</span>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <Layout>
        <SEOHead 
          title="Loading... | Letter of Dispute"
          description="Loading your letter editor"
          canonicalPath={`/letters/${purchaseId}/edit`}
          noIndex={true}
        />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !purchase) {
    return (
      <Layout>
        <SEOHead 
          title="Letter Not Found | Letter of Dispute"
          description="The requested letter could not be found"
          canonicalPath={`/letters/${purchaseId}/edit`}
          noIndex={true}
        />
        <div className="min-h-[60vh] py-16 md:py-24 bg-background">
          <div className="container-wide max-w-2xl">
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                Letter Not Found
              </h1>
              <p className="text-muted-foreground mb-6">{error || 'This letter could not be found.'}</p>
              <Button variant="accent" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead 
        title={`Edit: ${purchase.template_name} | Letter of Dispute`}
        description="Edit your dispute letter"
        canonicalPath={`/letters/${purchaseId}/edit`}
        noIndex={true}
      />

      <div className="min-h-[60vh] py-8 md:py-12 bg-background">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  {purchase.template_name}
                </h1>
                <EditAccessBadge expiresAt={purchase.edit_expires_at} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>

          {/* Editor or Locked State */}
          {hasEditAccess ? (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <LetterEditor
                content={content}
                onChange={setContent}
                onSave={handleSave}
                isSaving={isSaving}
                lastSavedAt={lastSavedAt}
              />
              <BrandingBadge />
            </div>
          ) : (
            <div className="relative">
              {/* Blurred preview */}
              <div className="blur-sm pointer-events-none">
                <LetterEditor
                  content={content}
                  onChange={() => {}}
                  onSave={() => {}}
                  isSaving={false}
                  lastSavedAt={null}
                  readOnly
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Card className="p-6 text-center max-w-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Editing Access Expired
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your 30-day editing period has ended. Unlock to continue editing.
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant="accent"
                      onClick={() => setShowUnlockModal(true)}
                    >
                      Unlock for $5.99
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleExportPdf}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download Last Saved PDF
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <UnlockEditingModal
          purchaseId={purchaseId!}
          templateName={purchase.template_name}
          onClose={() => setShowUnlockModal(false)}
          onUnlocked={() => {
            setShowUnlockModal(false);
            fetchPurchase();
          }}
        />
      )}
    </Layout>
  );
};

export default LetterEditorPage;
