import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, isValidImageType, formatFileSize } from '@/lib/imageCompression';
import { toast } from 'sonner';

export interface EvidencePhoto {
  id: string;
  file: File;
  preview: string;
  description: string;
  uploading: boolean;
  uploaded: boolean;
  storagePath?: string;
  error?: string;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB before compression

export function useEvidenceUpload() {
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addPhotos = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check limit
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    const filesToAdd = fileArray.slice(0, remainingSlots);
    if (fileArray.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more photo(s) can be added`);
    }

    // Validate and create previews
    const newPhotos: EvidencePhoto[] = [];
    
    for (const file of filesToAdd) {
      if (!isValidImageType(file)) {
        toast.error(`${file.name} is not a supported image type (JPEG, PNG, WebP only)`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max ${formatFileSize(MAX_FILE_SIZE)} before compression)`);
        continue;
      }

      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      
      newPhotos.push({
        id,
        file,
        preview,
        description: '',
        uploading: false,
        uploaded: false,
      });
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const updateDescription = useCallback((id: string, description: string) => {
    setPhotos(prev => 
      prev.map(p => p.id === id ? { ...p, description } : p)
    );
  }, []);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    setPhotos(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const uploadAllPhotos = useCallback(async (userId: string): Promise<{ storagePath: string; description: string }[]> => {
    if (photos.length === 0) return [];

    setIsUploading(true);
    const uploadedPhotos: { storagePath: string; description: string }[] = [];

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.uploaded && photo.storagePath) {
          uploadedPhotos.push({ 
            storagePath: photo.storagePath, 
            description: photo.description 
          });
          continue;
        }

        // Update status
        setPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, uploading: true, error: undefined } : p)
        );

        try {
          // Compress image
          const compressedBlob = await compressImage(photo.file, {
            maxWidth: 1200,
            maxHeight: 1600,
            quality: 0.8,
          });

          // Generate storage path
          const timestamp = Date.now();
          const extension = 'jpg'; // Always JPEG after compression
          const storagePath = `${userId}/${timestamp}-${i}.${extension}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('evidence-photos')
            .upload(storagePath, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Update photo status
          setPhotos(prev => 
            prev.map(p => p.id === photo.id 
              ? { ...p, uploading: false, uploaded: true, storagePath } 
              : p
            )
          );

          uploadedPhotos.push({ 
            storagePath, 
            description: photo.description 
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setPhotos(prev => 
            prev.map(p => p.id === photo.id 
              ? { ...p, uploading: false, error: errorMessage } 
              : p
            )
          );
          toast.error(`Failed to upload ${photo.file.name}`);
        }
      }

      return uploadedPhotos;

    } finally {
      setIsUploading(false);
    }
  }, [photos]);

  const clearAllPhotos = useCallback(() => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.preview);
    });
    setPhotos([]);
  }, [photos]);

  const hasPhotos = photos.length > 0;
  const canAddMore = photos.length < MAX_PHOTOS;
  const allUploaded = photos.length > 0 && photos.every(p => p.uploaded);

  return {
    photos,
    hasPhotos,
    canAddMore,
    allUploaded,
    isUploading,
    maxPhotos: MAX_PHOTOS,
    addPhotos,
    removePhoto,
    updateDescription,
    reorderPhotos,
    uploadAllPhotos,
    clearAllPhotos,
  };
}
