import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Sparkles, Check, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useImageSuggestions, type SuggestedImage } from '@/hooks/useImageSuggestions';
import { cn } from '@/lib/utils';

interface FeaturedImagePickerProps {
  topic: string;
  keywords?: string;
  selectedImage: SuggestedImage | null;
  onSelect: (image: SuggestedImage | null) => void;
  onGenerateAI?: () => void;
  isGeneratingAI?: boolean;
}

export function FeaturedImagePicker({
  topic,
  keywords,
  selectedImage,
  onSelect,
  onGenerateAI,
  isGeneratingAI,
}: FeaturedImagePickerProps) {
  const [searchQuery, setSearchQuery] = useState(topic);
  const { search, isLoading, images } = useImageSuggestions();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      search(searchQuery, keywords);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Featured Image</h3>
          {onGenerateAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAI}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate AI Image
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for images..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image) => (
              <div
                key={image.pixabay_id}
                className={cn(
                  "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                  selectedImage?.pixabay_id === image.pixabay_id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
                onClick={() => onSelect(
                  selectedImage?.pixabay_id === image.pixabay_id ? null : image
                )}
              >
                <img
                  src={image.thumbnail_url}
                  alt={image.alt_text}
                  className="w-full aspect-video object-cover"
                />
                
                {/* Selection indicator */}
                {selectedImage?.pixabay_id === image.pixabay_id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                {/* Source badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 text-xs bg-background/80 backdrop-blur-sm"
                >
                  Pixabay
                </Badge>

                {/* Photographer attribution */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={image.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white flex items-center gap-1 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.photographer}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedImage && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Selected:</strong> {selectedImage.alt_text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Photo by {selectedImage.photographer} on Pixabay
            </p>
          </div>
        )}

        {images.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Search for images or generate an AI image
          </p>
        )}
      </CardContent>
    </Card>
  );
}
