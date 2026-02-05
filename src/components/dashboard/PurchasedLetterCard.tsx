import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import EditAccessBadge from '@/components/letter/EditAccessBadge';

interface Purchase {
  id: string;
  template_name: string;
  purchase_type: string;
  amount_cents: number;
  created_at: string;
  status: string;
  edit_expires_at?: string | null;
}

interface PurchasedLetterCardProps {
  purchase: Purchase;
  featured?: boolean;
}

const PurchasedLetterCard = ({ purchase, featured = false }: PurchasedLetterCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-letter-urls', {
        body: { purchaseId: purchase.id },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate download URL');
      }

      if (!data.pdfUrl) {
        throw new Error('PDF not available for this purchase');
      }

      // Open the download URL
      const link = document.createElement('a');
      link.href = data.pdfUrl;
      link.download = `${purchase.template_name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download started',
        description: 'Your PDF is being downloaded.',
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasEditAccess = purchase.purchase_type === 'pdf-editable';

  if (featured) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-xl">
            <FileText className="h-6 w-6 text-success" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-lg">{purchase.template_name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{purchase.purchase_type === 'pdf-editable' ? 'PDF + Edit Access' : 'PDF Only'}</span>
              <span>•</span>
              <span>Purchased {formatDate(purchase.created_at)}</span>
            </div>
            {hasEditAccess && purchase.edit_expires_at && (
              <EditAccessBadge expiresAt={purchase.edit_expires_at} className="mt-1" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
          
          {hasEditAccess && (
            <Button 
              variant="accent" 
              size="lg"
              asChild
              className="gap-2"
            >
              <Link to={`/letters/${purchase.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit Letter
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-success/10 rounded-lg">
          <FileText className="h-5 w-5 text-success" />
        </div>
        <div>
          <h4 className="font-medium text-foreground">{purchase.template_name}</h4>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{purchase.purchase_type === 'pdf-editable' ? 'PDF + Edit' : 'PDF Only'}</span>
            <span>•</span>
            <span>{formatPrice(purchase.amount_cents)}</span>
            <span>•</span>
            <span>Purchased {formatDate(purchase.created_at)}</span>
          </div>
          {hasEditAccess && purchase.edit_expires_at && (
            <EditAccessBadge expiresAt={purchase.edit_expires_at} className="mt-1" />
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="default" className="bg-success">
          Purchased
        </Badge>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </>
          )}
        </Button>
        
        {hasEditAccess && (
          <Button 
            variant="accent" 
            size="sm"
            asChild
          >
            <Link to={`/letters/${purchase.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default PurchasedLetterCard;
