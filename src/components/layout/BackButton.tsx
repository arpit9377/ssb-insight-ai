import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export function BackButton({ to, children, variant = 'ghost', className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant={variant}
      onClick={handleBack}
      className={`mb-4 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children || 'Back'}
    </Button>
  );
}