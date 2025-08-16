import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from 'qrcode';

interface QRCodeDownloadProps {
  url?: string;
  title?: string;
  size?: number;
}

export const QRCodeDownload: React.FC<QRCodeDownloadProps> = ({ 
  url = window.location.href,
  title = 'QR Code',
  size = 256
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCodeGenerator.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "QR Code Downloaded!",
        description: "The QR code has been saved to your device."
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={downloadQRCode}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <QrCode className="h-4 w-4" />
          <Download className="h-4 w-4" />
          Download QR
        </>
      )}
    </Button>
  );
};