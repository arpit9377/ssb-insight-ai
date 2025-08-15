
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Eye, Upload, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUploadForm from '@/components/admin/ImageUploadForm';
import WordUploadForm from '@/components/admin/WordUploadForm';
import SituationUploadForm from '@/components/admin/SituationUploadForm';

const ContentManagement: React.FC = () => {
  const { toast } = useToast();
  const [testImages, setTestImages] = useState<any[]>([]);
  const [watWords, setWatWords] = useState<any[]>([]);
  const [srtSituations, setSrtSituations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageForm, setShowImageForm] = useState(false);
  const [showWordForm, setShowWordForm] = useState(false);
  const [showSituationForm, setShowSituationForm] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load test images
      const { data: images, error: imagesError } = await supabase
        .from('test_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      // Load WAT words  
      const { data: words, error: wordsError } = await supabase
        .from('wat_words')
        .select('*')
        .order('created_at', { ascending: false });

      if (wordsError) throw wordsError;

      // Load SRT situations
      const { data: situations, error: situationsError } = await supabase
        .from('srt_situations')
        .select('*')
        .order('created_at', { ascending: false });

      if (situationsError) throw situationsError;

      setTestImages(images || []);
      setWatWords(words || []);
      setSrtSituations(situations || []);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const deleteTestImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
      loadContent();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const deleteWatWord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wat_words')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Word deleted successfully"
      });
      loadContent();
    } catch (error) {
      console.error('Error deleting word:', error);
      toast({
        title: "Error", 
        description: "Failed to delete word",
        variant: "destructive"
      });
    }
  };

  const deleteSrtSituation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('srt_situations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Situation deleted successfully"
      });
      loadContent();
    } catch (error) {
      console.error('Error deleting situation:', error);
      toast({
        title: "Error",
        description: "Failed to delete situation", 
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">Test Images</TabsTrigger>
          <TabsTrigger value="words">WAT Words</TabsTrigger>
          <TabsTrigger value="situations">SRT Situations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Images ({testImages.length})</CardTitle>
              <Button onClick={() => setShowImageForm(!showImageForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </CardHeader>
            <CardContent>
              {showImageForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <ImageUploadForm onImageUploaded={() => {
                    setShowImageForm(false);
                    loadContent();
                  }} />
                </div>
              )}
              
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
        </TabsContent>

        <TabsContent value="words" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>WAT Words ({watWords.length})</CardTitle>
              <Button onClick={() => setShowWordForm(!showWordForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Words
              </Button>
            </CardHeader>
            <CardContent>
              {showWordForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <WordUploadForm 
                    onWordAdded={() => {
                      setShowWordForm(false);
                      loadContent();
                    }}
                    wordCount={watWords.length}
                  />
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watWords.slice(0, 50).map((word: any) => (
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
        </TabsContent>

        <TabsContent value="situations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>SRT Situations ({srtSituations.length})</CardTitle>
              <Button onClick={() => setShowSituationForm(!showSituationForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Situations
              </Button>
            </CardHeader>
            <CardContent>
              {showSituationForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <SituationUploadForm 
                    onSituationAdded={() => {
                      setShowSituationForm(false);
                      loadContent();
                    }}
                    situationCount={srtSituations.length}
                  />
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Situation</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {srtSituations.slice(0, 20).map((situation: any) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement;
