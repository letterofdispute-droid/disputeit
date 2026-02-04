import { useState, useRef, useEffect } from 'react';
import { ImageIcon, Upload, RefreshCw, Loader2, X, Check, Sparkles } from 'lucide-react';
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

interface FeaturedImageUploaderProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  title: string;
  excerpt: string;
}

const FeaturedImageUploader = ({
  imageUrl,
  onImageChange,
  title,
  excerpt,
}: FeaturedImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);
  const [imageOffset, setImageOffset] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Track if we've already fetched for this title
  const [lastFetchedTitle, setLastFetchedTitle] = useState('');

  // Auto-fetch images when title changes (with debounce)
  useEffect(() => {
    if (title && title.length > 10 && title !== lastFetchedTitle && !imageUrl) {
      const timer = setTimeout(() => {
        fetchSuggestedImages();
        setLastFetchedTitle(title);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [title]);

  const fetchSuggestedImages = async (offset = 0) => {
    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please add a title to get image suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-images', {
        body: { 
          topic: title, 
          keywords: excerpt,
          count: 4,
          offset 
        },
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setSuggestedImages(data.images);
        setImageOffset(offset);
      } else {
        toast({
          title: 'No images found',
          description: 'Try modifying the title for better results.',
        });
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Failed to fetch images',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFindMore = () => {
    fetchSuggestedImages(imageOffset + 4);
  };

  const handleSelectImage = (url: string) => {
    setSelectedUrl(url);
    onImageChange(url);
    toast({
      title: 'Image selected',
      description: 'Featured image has been set.',
    });
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
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await supabase.storage
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
      setSelectedUrl(publicUrl);
      toast({
        title: 'Image uploaded',
        description: 'Featured image has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please add a title before generating an image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { title, excerpt },
      });

      if (error) throw error;

      if (data.imageUrl) {
        onImageChange(data.imageUrl);
        setSelectedUrl(data.imageUrl);
        toast({
          title: 'Image generated',
          description: 'AI-generated featured image has been set.',
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate image. Try selecting from Pixabay instead.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
    setSelectedUrl('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Featured Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current selected image or placeholder */}
        {imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Featured"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Image suggestions grid */}
            {suggestedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {suggestedImages.map((img) => (
                  <button
                    key={img.pixabay_id}
                    onClick={() => handleSelectImage(img.url)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:ring-2 hover:ring-accent/50",
                      selectedUrl === img.url 
                        ? "border-accent ring-2 ring-accent" 
                        : "border-border"
                    )}
                  >
                    <img
                      src={img.thumbnail_url}
                      alt={img.alt_text}
                      className="w-full h-full object-cover"
                    />
                    {selectedUrl === img.url && (
                      <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-accent-foreground bg-accent rounded-full p-1" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <span className="text-[10px] text-white truncate block">
                        by {img.photographer}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full h-32 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {title ? 'Loading suggestions...' : 'Add title to get suggestions'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!imageUrl && suggestedImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFindMore}
              disabled={isLoadingImages}
              className="flex-1 h-8 text-xs"
            >
              {isLoadingImages ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Find More
            </Button>
          )}
          
          {!imageUrl && suggestedImages.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSuggestedImages()}
              disabled={isLoadingImages || !title}
              className="flex-1 h-8 text-xs"
            >
              {isLoadingImages ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ImageIcon className="h-3 w-3 mr-1" />
              )}
              Find Images
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 h-8 text-xs"
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            Upload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateImage}
            disabled={isGenerating || !title}
            className="flex-1 h-8 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            AI Gen
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default FeaturedImageUploader;
