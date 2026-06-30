import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * QRScanner — uses the native BarcodeDetector API where available
 * (Chromium-based browsers) to read a QR code from the device camera
 * and return the decoded text. Gracefully tells the user when the
 * browser can't help, in which case they paste the secret instead.
 */
export function QRScanner({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!open) return;
    const BD = (window as any).BarcodeDetector;
    if (!BD) {
      setSupported(false);
      return;
    }

    let cancelled = false;
    const detector = new BD({ formats: ['qr_code'] });

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const loop = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              onResult(codes[0].rawValue);
              return;
            }
          } catch {
            /* ignore frame */
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e: any) {
        setError(e?.message ?? 'Camera unavailable');
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onResult]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4 text-primary" />
            Scan the QR code your service shows you
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            This browser doesn't expose a QR reader. Switch to manual entry and paste the
            secret Ray shows you on the next screen instead.
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-md border bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-6 rounded-md border-2 border-primary/70" />
          </div>
        )}
        <p className="pt-3 text-xs text-muted-foreground">
          Ray never sends what the camera sees anywhere — the QR code is read locally and
          the secret is encrypted before it leaves your browser.
        </p>
      </div>
    </div>
  );
}
