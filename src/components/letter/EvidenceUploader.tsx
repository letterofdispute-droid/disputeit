import { useCallback, useRef, useState } from 'react';
import { ImagePlus, X, Loader2, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EvidencePhoto } from '@/hooks/useEvidenceUpload';

interface EvidenceUploaderProps {
  photos: EvidencePhoto[];
  canAddMore: boolean;
  maxPhotos: number;
  onAddPhotos: (files: FileList | File[]) => void;
  onRemovePhoto: (id: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
}

const EvidenceUploader = ({
  photos,
  canAddMore,
  maxPhotos,
  onAddPhotos,
  onRemovePhoto,
  onUpdateDescription,
}: EvidenceUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onAddPhotos(files);
    }
  }, [onAddPhotos]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddPhotos(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [onAddPhotos]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-accent" />
          Evidence Photos
        </CardTitle>
        <CardDescription>
          Upload up to {maxPhotos} photos as evidence to include in your letter.
          Photos will be compressed and embedded in the PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={cn(
                  "relative group rounded-lg border overflow-hidden bg-muted/30",
                  photo.error && "border-destructive",
                  photo.uploaded && "border-success"
                )}
              >
                {/* Image preview */}
                <div className="aspect-square relative">
                  <img
                    src={photo.preview}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status overlay */}
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  )}
                  
                  {photo.uploaded && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  )}
                  
                  {photo.error && (
                    <div className="absolute top-2 right-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    className="absolute top-2 left-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    disabled={photo.uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {/* Position indicator */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-background/80 rounded text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
                
                {/* Description - click to edit with textarea */}
                <div className="p-2">
                  {photo.description ? (
                    <div 
                      className="text-xs text-foreground bg-background/50 rounded p-1.5 cursor-pointer hover:bg-muted/50 transition-colors min-h-[32px] line-clamp-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newDesc = window.prompt('Photo description:', photo.description);
                        if (newDesc !== null) {
                          onUpdateDescription(photo.id, newDesc);
                        }
                      }}
                      title="Click to edit description"
                    >
                      {photo.description}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newDesc = window.prompt('Add a description for this photo:');
                        if (newDesc) {
                          onUpdateDescription(photo.id, newDesc);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
                      disabled={photo.uploading}
                    >
                      <Pencil className="h-3 w-3" />
                      Add description
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone / Add button */}
        {canAddMore && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={openFilePicker}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer"
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop photos or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {photos.length}/{maxPhotos} photos • JPEG, PNG, WebP
            </p>
          </div>
        )}

        {/* Maximum reached notice */}
        {!canAddMore && (
          <p className="text-xs text-muted-foreground text-center">
            Maximum {maxPhotos} photos reached
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EvidenceUploader;
