
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SituationUploadFormProps {
  onSituationAdded: () => void;
  situationCount: number;
}

const SituationUploadForm: React.FC<SituationUploadFormProps> = ({ onSituationAdded, situationCount }) => {
  const [newSituation, setNewSituation] = useState('');

  const handleAddSrtSituation = async () => {
    if (!newSituation.trim()) {
      toast.error('Please enter a situation');
      return;
    }

    try {
      const { error } = await supabase
        .from('srt_situations')
        .insert({
          situation: newSituation.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Situation added successfully!');
      setNewSituation('');
      onSituationAdded();
    } catch (error) {
      console.error('Error adding situation:', error);
      toast.error('Failed to add situation');
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Add SRT Situations</CardTitle>
        <CardDescription>Add situations for Situation Reaction Test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="srtSituation">Situation</Label>
          <Textarea
            id="srtSituation"
            value={newSituation}
            onChange={(e) => setNewSituation(e.target.value)}
            placeholder="Enter a situation scenario..."
            rows={3}
          />
        </div>
        <Button onClick={handleAddSrtSituation}>
          <Upload className="h-4 w-4 mr-2" />
          Add Situation
        </Button>
        <div className="text-sm text-gray-600">
          Total SRT situations: {situationCount}
        </div>
      </CardContent>
    </Card>
  );
};

export default SituationUploadForm;
