
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BulkUploadFormProps {
  onUploadComplete: () => void;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ onUploadComplete }) => {
  const [uploadType, setUploadType] = useState<'images' | 'words' | 'situations'>('words');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        toast.error('Please upload a CSV or TXT file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSVContent = (content: string): string[] => {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Handle CSV format - take first column if comma-separated
        return line.split(',')[0].trim().replace(/"/g, '');
      });
  };

  const handleBulkUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const content = await file.text();
      const items = parseCSVContent(content);

      if (items.length === 0) {
        toast.error('No valid items found in the file');
        setIsUploading(false);
        return;
      }

      let uploadedCount = 0;
      let errorCount = 0;

      // Process in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        if (uploadType === 'words') {
          const wordsData = batch.map(word => ({
            word: word,
            is_active: true,
            usage_count: 0
          }));

          const { error } = await supabase
            .from('wat_words')
            .insert(wordsData);

          if (error) {
            console.error('Error uploading words batch:', error);
            errorCount += batch.length;
          } else {
            uploadedCount += batch.length;
          }

        } else if (uploadType === 'situations') {
          const situationsData = batch.map(situation => ({
            situation: situation,
            is_active: true,
            usage_count: 0
          }));

          const { error } = await supabase
            .from('srt_situations')
            .insert(situationsData);

          if (error) {
            console.error('Error uploading situations batch:', error);
            errorCount += batch.length;
          } else {
            uploadedCount += batch.length;
          }
        }
      }

      if (uploadedCount > 0) {
        toast.success(`Successfully uploaded ${uploadedCount} ${uploadType}!`);
        onUploadComplete();
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }

      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} items. Check console for details.`);
      }

    } catch (error) {
      console.error('Error processing bulk upload:', error);
      toast.error('Failed to process the file');
    } finally {
      setIsUploading(false);
    }
  };

  const getFormatInstructions = () => {
    switch (uploadType) {
      case 'words':
        return 'Upload a CSV or TXT file with one word per line. Example:\nCourage\nLeadership\nDiscipline';
      case 'situations':
        return 'Upload a CSV or TXT file with one situation per line. Example:\nYou are leading a team project...\nA conflict arises between team members...';
      case 'images':
        return 'Image bulk upload coming soon. Please use individual upload for now.';
      default:
        return '';
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Upload
        </CardTitle>
        <CardDescription>Upload multiple items at once using CSV or TXT files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="upload-type">Upload Type</Label>
          <Select value={uploadType} onValueChange={(value: 'images' | 'words' | 'situations') => setUploadType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="words">WAT Words</SelectItem>
              <SelectItem value="situations">SRT Situations</SelectItem>
              <SelectItem value="images" disabled>Test Images (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bulk-file-input">Upload File</Label>
          <Input
            id="bulk-file-input"
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={uploadType === 'images'}
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-blue-900">File Format:</p>
              <p className="text-sm text-blue-700 whitespace-pre-line mt-1">
                {getFormatInstructions()}
              </p>
            </div>
          </div>
        </div>

        {file && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">Selected File:</p>
            <p className="text-sm text-gray-600">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          </div>
        )}

        <Button 
          onClick={handleBulkUpload} 
          disabled={!file || isUploading || uploadType === 'images'}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : `Upload ${uploadType}`}
        </Button>

        {uploadType === 'images' && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Image Bulk Upload</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Bulk image upload requires additional processing and will be available in the next update. 
                  Please use the individual image upload for now.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUploadForm;
