import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface ImageSlot {
  id: string;
  label: string;
  file: File | null;
  preview: string | null;
  uploaded: boolean;
  error: string | null;
}

interface BatchImageUploadProps {
  testType: 'tat' | 'wat' | 'srt';
  totalSlots: number;
  slotLabels?: string[];
  onUploadComplete: (imageUrls: string[]) => void;
  onSkip?: () => void;
  allowSkip?: boolean;
  allowDynamicSlots?: boolean; // For WAT/SRT - can add/remove sheets
  minSlots?: number; // Minimum sheets required
  maxSlots?: number; // Maximum sheets allowed
}

export const BatchImageUpload: React.FC<BatchImageUploadProps> = ({
  testType,
  totalSlots,
  slotLabels,
  onUploadComplete,
  onSkip,
  allowSkip = true,
  allowDynamicSlots = false,
  minSlots = 1,
  maxSlots = 10
}) => {
  const initialSlotCount = allowDynamicSlots ? minSlots : totalSlots;
  
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
    Array.from({ length: initialSlotCount }, (_, i) => ({
      id: `slot-${i}`,
      label: slotLabels?.[i] || (allowDynamicSlots ? `Sheet ${i + 1}` : `${testType.toUpperCase()} ${i + 1}`),
      file: null,
      preview: null,
      uploaded: false,
      error: null
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  const handleFileSelect = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Compress image
    const compressedFile = await compressImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSlots(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          file: compressedFile,
          preview: reader.result as string,
          error: null
        };
        return updated;
      });
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleBulkUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (let i = 0; i < Math.min(fileArray.length, totalSlots); i++) {
      if (fileArray[i].type.startsWith('image/')) {
        await handleFileSelect(i, fileArray[i]);
      }
    }

    if (fileArray.length > totalSlots) {
      toast.warning(`Only first ${totalSlots} images were loaded`);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageSlots(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        file: null,
        preview: null,
        uploaded: false,
        error: null
      };
      return updated;
    });
  };

  const addSheet = () => {
    if (imageSlots.length >= maxSlots) {
      toast.error(`Maximum ${maxSlots} sheets allowed`);
      return;
    }
    
    const newSlot: ImageSlot = {
      id: `slot-${imageSlots.length}`,
      label: `Sheet ${imageSlots.length + 1}`,
      file: null,
      preview: null,
      uploaded: false,
      error: null
    };
    
    setImageSlots(prev => [...prev, newSlot]);
  };

  const removeSheet = (index: number) => {
    if (imageSlots.length <= minSlots) {
      toast.error(`Minimum ${minSlots} sheet required`);
      return;
    }
    
    setImageSlots(prev => prev.filter((_, i) => i !== index));
  };

  const validateImages = (): boolean => {
    const filledSlots = imageSlots.filter(slot => slot.file).length;
    
    if (allowDynamicSlots) {
      // For dynamic slots (WAT/SRT), at least 1 sheet must be uploaded
      if (filledSlots === 0) {
        toast.error('Please upload at least 1 sheet');
        return false;
      }
    } else {
      // For fixed slots (TAT), all must be filled
      const emptySlots = imageSlots.filter(slot => !slot.file);
      if (emptySlots.length > 0) {
        toast.error(`Please upload images for all ${totalSlots} responses`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateImages()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const imageUrls: string[] = [];
      const totalImages = imageSlots.filter(slot => slot.file).length;
      
      // Get user ID from auth context (will be passed via props in actual implementation)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest';

      for (let i = 0; i < imageSlots.length; i++) {
        const slot = imageSlots[i];
        if (!slot.file) continue;

        try {
          // Upload to Supabase storage
          const timestamp = Date.now();
          const fileName = `${testType}-responses/${userId}/${timestamp}-${i}-${slot.file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('test-images')
            .upload(fileName, slot.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for slot ${i}:`, uploadError);
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('test-images')
            .getPublicUrl(fileName);
          
          imageUrls.push(publicUrl);
          console.log(`Uploaded image ${i + 1}/${totalImages}: ${publicUrl}`);

          // Update progress
          setUploadProgress(((i + 1) / totalImages) * 100);

          // Mark as uploaded
          setImageSlots(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploaded: true };
            return updated;
          });
        } catch (slotError) {
          console.error(`Error uploading slot ${i}:`, slotError);
          setImageSlots(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], error: 'Upload failed' };
            return updated;
          });
          throw slotError;
        }
      }

      toast.success('All images uploaded successfully!');
      onUploadComplete(imageUrls);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images. Please try again.');
      setIsUploading(false);
    }
  };

  const uploadedCount = imageSlots.filter(slot => slot.file).length;
  const allUploaded = allowDynamicSlots 
    ? uploadedCount >= minSlots  // For WAT/SRT: at least 1 sheet
    : uploadedCount === totalSlots;  // For TAT: all 13 images

  const getInstructions = () => {
    switch (testType) {
      case 'tat':
        return {
          title: 'Upload Your TAT Story Images',
          description: 'Upload clear photos of your handwritten stories for each of the 12 TAT images.',
          tips: [
            'Take photos in good lighting',
            'Ensure all text is visible and readable',
            'One story per image',
            'Hold camera steady to avoid blur'
          ]
        };
      case 'wat':
        return {
          title: 'Upload Your WAT Response Sheet(s)',
          description: 'Upload photos of your handwritten word association responses.',
          tips: [
            'Capture entire response sheet',
            'Make sure all 60 words are visible',
            'Good lighting is essential',
            'You can upload 1-3 sheets depending on how you wrote'
          ]
        };
      case 'srt':
        return {
          title: 'Upload Your SRT Response Sheet(s)',
          description: 'Upload photos of your handwritten situation reaction responses.',
          tips: [
            'Capture entire response sheet',
            'Ensure all responses are readable',
            'Good lighting and focus',
            'Upload all sheets if you used multiple pages'
          ]
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-blue-600" />
              {instructions.title}
            </CardTitle>
            <p className="text-gray-600 mt-2">{instructions.description}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📸 Upload Tips:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                {instructions.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Upload Progress</span>
                <span className="text-gray-600">
                  {uploadedCount} / {imageSlots.length} {allowDynamicSlots ? 'sheets' : 'images'}
                </span>
              </div>
              <Progress value={(uploadedCount / imageSlots.length) * 100} className="h-2" />
            </div>

            {/* Bulk Upload and Add Sheet Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById('bulk-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Multiple Images
              </Button>
              {allowDynamicSlots && imageSlots.length < maxSlots && (
                <Button
                  variant="outline"
                  onClick={addSheet}
                  disabled={isUploading}
                >
                  + Add Sheet
                </Button>
              )}
              <input
                id="bulk-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
              />
            </div>

            {/* Image Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageSlots.map((slot, index) => (
                <Card key={slot.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Label */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{slot.label}</span>
                        <div className="flex items-center gap-2">
                          {slot.file && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {allowDynamicSlots && imageSlots.length > minSlots && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeSheet(index)}
                              disabled={isUploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Preview or Upload Area */}
                      {slot.preview ? (
                        <div className="relative">
                          <img
                            src={slot.preview}
                            alt={slot.label}
                            className="w-full h-40 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveImage(index)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {slot.uploaded && (
                            <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                              Uploaded
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 mb-3">
                            Click to upload
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            id={`upload-${index}`}
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(index, e.target.files[0])}
                            disabled={isUploading}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`upload-${index}`)?.click()}
                            disabled={isUploading}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Choose
                          </Button>
                        </div>
                      )}

                      {slot.error && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {slot.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Upload Progress Bar (during upload) */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading images...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {allowSkip && onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Skip Upload (Use Typed Responses)
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!allUploaded || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit for Analysis
                  </>
                )}
              </Button>
            </div>

            {!allUploaded && (
              <p className="text-sm text-center text-gray-500">
                {allowDynamicSlots 
                  ? `Please upload at least ${minSlots} sheet(s) to continue`
                  : `Please upload all ${imageSlots.length} images to continue`
                }
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
