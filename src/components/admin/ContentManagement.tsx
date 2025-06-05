
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ContentManagementProps {
  testImages: any[];
  watWords: any[];
  srtSituations: any[];
  onContentDeleted: () => void;
}

const ContentManagement: React.FC<ContentManagementProps> = ({ 
  testImages, 
  watWords, 
  srtSituations, 
  onContentDeleted 
}) => {
  const deleteTestImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Image deleted successfully!');
      onContentDeleted();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const deleteWatWord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wat_words')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Word deleted successfully!');
      onContentDeleted();
    } catch (error) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete word');
    }
  };

  const deleteSrtSituation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('srt_situations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Situation deleted successfully!');
      onContentDeleted();
    } catch (error) {
      console.error('Error deleting situation:', error);
      toast.error('Failed to delete situation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Images */}
      <Card>
        <CardHeader>
          <CardTitle>Test Images ({testImages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testImages.map((image: any) => (
              <div key={image.id} className="border rounded-lg p-4">
                <img 
                  src={image.image_url} 
                  alt="Test" 
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="font-medium">{image.test_type.toUpperCase()}</p>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{image.prompt}</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTestImage(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(image.image_url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WAT Words Table */}
      <Card>
        <CardHeader>
          <CardTitle>WAT Words ({watWords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watWords.slice(0, 20).map((word: any) => (
                <TableRow key={word.id}>
                  <TableCell className="font-medium">{word.word}</TableCell>
                  <TableCell>{new Date(word.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteWatWord(word.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SRT Situations Table */}
      <Card>
        <CardHeader>
          <CardTitle>SRT Situations ({srtSituations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Situation</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {srtSituations.slice(0, 10).map((situation: any) => (
                <TableRow key={situation.id}>
                  <TableCell className="font-medium max-w-md truncate">{situation.situation}</TableCell>
                  <TableCell>{new Date(situation.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteSrtSituation(situation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagement;
