import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Check, Sparkles } from 'lucide-react';

interface UploadFeatureAnnouncementProps {
  storageKey?: string;
}

export function UploadFeatureAnnouncement({ 
  storageKey = 'hasSeenUploadFeatureAnnouncement' 
}: UploadFeatureAnnouncementProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem(storageKey);
    if (!hasSeenAnnouncement) {
      // Show after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-full">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            <span className="inline-flex items-center gap-2">
              New Feature! <Sparkles className="h-5 w-5 text-yellow-500" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-base space-y-4 pt-2">
            <p className="font-semibold text-foreground">
              Upload Your Handwritten Responses!
            </p>
            <p>
              Now you can upload photos of your handwritten answers for PPDT, TAT, and WAT tests.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-left">AI analyzes your handwriting and content</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-left">Get feedback on presentation quality</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-left">Practice like the real SSB exam</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Got it, Let's Try!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
