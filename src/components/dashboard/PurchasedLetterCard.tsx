import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileEdit, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Purchase {
  id: string;
  template_name: string;
  purchase_type: string;
  amount_cents: number;
  created_at: string;
  status: string;
}

interface PurchasedLetterCardProps {
  purchase: Purchase;
  featured?: boolean;
}

const PurchasedLetterCard = ({ purchase, featured = false }: PurchasedLetterCardProps) => {
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'docx' | null>(null);

  const handleDownload = async (type: 'pdf' | 'docx') => {
    setIsDownloading(type);
    
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-letter-urls', {
        body: { purchaseId: purchase.id },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate download URL');
      }

      const url = type === 'pdf' ? data.pdfUrl : data.docxUrl;
      
      if (!url) {
        throw new Error(`${type.toUpperCase()} not available for this purchase`);
      }

      // Open the download URL
      const link = document.createElement('a');
      link.href = url;
      link.download = `${purchase.template_name.replace(/\s+/g, '-').toLowerCase()}.${type}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download started',
        description: `Your ${type.toUpperCase()} is being downloaded.`,
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(null);
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

  if (featured) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-xl">
            <FileText className="h-6 w-6 text-success" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-lg">{purchase.template_name}</h4>
            <p className="text-sm text-muted-foreground">
              {purchase.purchase_type === 'pdf-editable' ? 'PDF + Editable Word' : 'PDF Only'} 
              {' • '}Purchased {formatDate(purchase.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="accent" 
            size="lg"
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading !== null}
            className="gap-2"
          >
            {isDownloading === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
          
          {purchase.purchase_type === 'pdf-editable' && (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleDownload('docx')}
              disabled={isDownloading !== null}
              className="gap-2"
            >
              {isDownloading === 'docx' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileEdit className="h-4 w-4" />
                  Word Doc
                </>
              )}
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
          <p className="text-sm text-muted-foreground">
            {purchase.purchase_type === 'pdf-editable' ? 'PDF + Editable' : 'PDF Only'} 
            {' • '}{formatPrice(purchase.amount_cents)} 
            {' • '}Purchased {formatDate(purchase.created_at)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="default" className="bg-success">
          Purchased
        </Badge>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleDownload('pdf')}
          disabled={isDownloading !== null}
        >
          {isDownloading === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </>
          )}
        </Button>
        
        {purchase.purchase_type === 'pdf-editable' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDownload('docx')}
            disabled={isDownloading !== null}
          >
            {isDownloading === 'docx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileEdit className="h-4 w-4 mr-1" />
                Word
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PurchasedLetterCard;
