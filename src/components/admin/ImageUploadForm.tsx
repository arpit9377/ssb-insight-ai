
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ImageUploadFormProps {
  onImageUploaded: () => void;
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onImageUploaded }) => {
  const [newImage, setNewImage] = useState({
    testType: 'ppdt',
    prompt: '',
    imageFile: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async () => {
    if (!newImage.imageFile || !newImage.prompt) {
      toast.error('Please select an image and enter a prompt');
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = newImage.imageFile.name.split('.').pop();
      const fileName = `${newImage.testType}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log('Uploading file:', fileName);
      
      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, newImage.imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      // Get the highest sequence number for this test type
      const { data: existingImages, error: fetchError } = await supabase
        .from('test_images')
        .select('sequence_number')
        .eq('test_type', newImage.testType)
        .order('sequence_number', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing images:', fetchError);
      }

      const nextSequenceNumber = existingImages && existingImages.length > 0 
        ? existingImages[0].sequence_number + 1 
        : 1;

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('test_images')
        .insert({
          test_type: newImage.testType,
          image_url: urlData.publicUrl,
          prompt: newImage.prompt,
          sequence_number: nextSequenceNumber,
          is_active: true,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Database insert successful:', dbData);

      toast.success('Image uploaded successfully!');
      setNewImage({ testType: 'ppdt', prompt: '', imageFile: null });
      
      // Reset the file input
      const fileInput = document.getElementById('imageFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      onImageUploaded();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image';
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Test Images</CardTitle>
        <CardDescription>Add images for PPDT and TAT tests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="testType">Test Type</Label>
          <Select value={newImage.testType} onValueChange={(value) => setNewImage({...newImage, testType: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ppdt">PPDT</SelectItem>
              <SelectItem value="tat">TAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="imageFile">Image File</Label>
          <Input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={(e) => setNewImage({...newImage, imageFile: e.target.files?.[0] || null})}
          />
        </div>
        <div>
          <Label htmlFor="prompt">Prompt/Description</Label>
          <Textarea
            id="prompt"
            value={newImage.prompt}
            onChange={(e) => setNewImage({...newImage, prompt: e.target.value})}
            placeholder="Enter prompt or description for this image..."
          />
        </div>
        <Button onClick={handleImageUpload} disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ImageUploadForm;
