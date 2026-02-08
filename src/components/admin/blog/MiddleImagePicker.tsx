import { useState, useRef, useEffect } from 'react';
import { ImageIcon, Upload, RefreshCw, Loader2, X, Check, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SuggestedImage {
  url: string;
  thumbnail_url: string;
  alt_text: string;
  photographer: string;
  pixabay_id: number;
}

// Article types that benefit from infographics
const INFOGRAPHIC_TYPES = ['comparison', 'checklist', 'how-to', 'mistakes', 'rights'];

interface MiddleImagePickerProps {
  content: string;
  middleImage1Url: string;
  middleImage2Url: string;
  onMiddleImage1Change: (url: string) => void;
  onMiddleImage2Change: (url: string) => void;
  title: string;
  articleType?: string;
}

const MiddleImagePicker = ({
  content,
  middleImage1Url,
  middleImage2Url,
  onMiddleImage1Change,
  onMiddleImage2Change,
  title,
  articleType,
}: MiddleImagePickerProps) => {
  // Detect which placeholders exist in content
  const hasPlaceholder1 = content.includes('{{MIDDLE_IMAGE_1}}') || content.includes('{{MIDDLE_IMAGE}}');
  const hasPlaceholder2 = content.includes('{{MIDDLE_IMAGE_2}}');

  // Don't render if no placeholders
  if (!hasPlaceholder1 && !hasPlaceholder2) {
    return null;
  }

  // Check if this article type supports infographics
  const supportsInfographic = articleType && INFOGRAPHIC_TYPES.includes(articleType);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Middle Images</CardTitle>
        <p className="text-xs text-muted-foreground">
          {supportsInfographic 
            ? 'Generate an infographic or select a photo'
            : 'These appear at placeholders in your content'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPlaceholder1 && (
          <ImageSlot
            label={hasPlaceholder2 ? "Image 1 (at ~33%)" : "Middle Image"}
            imageUrl={middleImage1Url}
            onImageChange={onMiddleImage1Change}
            title={title}
            offset={8}
            articleType={articleType}
            content={content}
            supportsInfographic={supportsInfographic}
          />
        )}
        {hasPlaceholder2 && (
          <ImageSlot
            label="Image 2 (at ~66%)"
            imageUrl={middleImage2Url}
            onImageChange={onMiddleImage2Change}
            title={title}
            offset={12}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface ImageSlotProps {
  label: string;
  imageUrl: string;
  onImageChange: (url: string) => void;
  title: string;
  offset: number;
  articleType?: string;
  content?: string;
  supportsInfographic?: boolean;
}

const ImageSlot = ({ 
  label, 
  imageUrl, 
  onImageChange, 
  title, 
  offset, 
  articleType,
  content,
  supportsInfographic = false 
}: ImageSlotProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);
  const [imageOffset, setImageOffset] = useState(offset);
  const [hasFetched, setHasFetched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-fetch images when title is available
  useEffect(() => {
    if (title && title.length > 10 && !imageUrl && !hasFetched) {
      const timer = setTimeout(() => {
        fetchSuggestedImages(offset);
        setHasFetched(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, imageUrl, hasFetched, offset]);

  const fetchSuggestedImages = async (currentOffset: number) => {
    if (!title) return;

    setIsLoadingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-images', {
        body: { 
          topic: title, 
          keywords: 'blog article content',
          count: 4,
          offset: currentOffset 
        },
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setSuggestedImages(data.images);
        setImageOffset(currentOffset);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFindMore = () => {
    fetchSuggestedImages(imageOffset + 4);
  };

  const handleSelectImage = (url: string) => {
    onImageChange(url);
    toast({ title: 'Image selected' });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `middle-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast({ title: 'Image uploaded' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
  };

  const handleGenerateInfographic = async () => {
    if (!articleType || !content || !title) {
      toast({
        title: 'Missing data',
        description: 'Article type, content, and title are required for infographic generation.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingInfographic(true);
    try {
      // Generate a unique storage path
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      const storagePath = `articles/${slug}-infographic-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('generate-infographic', {
        body: {
          title,
          articleType,
          content,
          storagePath,
        },
      });

      if (error) throw error;

      if (data?.success && data?.url) {
        onImageChange(data.url);
        toast({ 
          title: 'Infographic generated!',
          description: `${data.type} visualization with ${data.itemCount} key points`,
        });
      } else {
        throw new Error(data?.reason || 'Failed to generate infographic');
      }
    } catch (error) {
      console.error('Error generating infographic:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate infographic',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingInfographic(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      
      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Middle"
            className="w-full h-20 object-cover rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          {suggestedImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              {suggestedImages.map((img) => (
                <button
                  key={img.pixabay_id}
                  onClick={() => handleSelectImage(img.url)}
                  className={cn(
                    "relative aspect-square rounded overflow-hidden border transition-all hover:ring-1 hover:ring-accent/50",
                    imageUrl === img.url 
                      ? "border-accent ring-1 ring-accent" 
                      : "border-border"
                  )}
                >
                  <img
                    src={img.thumbnail_url}
                    alt={img.alt_text}
                    className="w-full h-full object-cover"
                  />
                  {imageUrl === img.url && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-accent-foreground bg-accent rounded-full p-0.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full h-16 bg-muted/30 rounded flex items-center justify-center border border-dashed border-border">
              {isLoadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-1">
        {/* Infographic generation button - only for supported types */}
        {supportsInfographic && !imageUrl && (
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateInfographic}
            disabled={isGeneratingInfographic || !content}
            className="flex-1 h-6 text-[10px] bg-accent hover:bg-accent/90"
            title="Generate AI infographic based on article content"
          >
            {isGeneratingInfographic ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <>
                <BarChart3 className="h-2.5 w-2.5 mr-1" />
                Infographic
              </>
            )}
          </Button>
        )}
        
        {!imageUrl && suggestedImages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFindMore}
            disabled={isLoadingImages}
            className="flex-1 h-6 text-[10px]"
          >
            {isLoadingImages ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <RefreshCw className="h-2.5 w-2.5" />
            )}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 h-6 text-[10px]"
        >
          {isUploading ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Upload className="h-2.5 w-2.5" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default MiddleImagePicker;
