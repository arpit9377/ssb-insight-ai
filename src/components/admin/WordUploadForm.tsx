
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WordUploadFormProps {
  onWordAdded: () => void;
  wordCount: number;
}

const WordUploadForm: React.FC<WordUploadFormProps> = ({ onWordAdded, wordCount }) => {
  const [newWord, setNewWord] = useState('');

  const handleAddWatWord = async () => {
    if (!newWord.trim()) {
      toast.error('Please enter a word');
      return;
    }

    try {
      const { error } = await supabase
        .from('wat_words')
        .insert({
          word: newWord.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Word added successfully!');
      setNewWord('');
      onWordAdded();
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error('Failed to add word');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add WAT Words</CardTitle>
        <CardDescription>Add words for Word Association Test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="watWord">Word</Label>
          <Input
            id="watWord"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Enter a word..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddWatWord()}
          />
        </div>
        <Button onClick={handleAddWatWord}>
          <Upload className="h-4 w-4 mr-2" />
          Add Word
        </Button>
        <div className="text-sm text-gray-600">
          Total WAT words: {wordCount}
        </div>
      </CardContent>
    </Card>
  );
};

export default WordUploadForm;
