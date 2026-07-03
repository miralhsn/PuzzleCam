'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not in DOM');

      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Camera timeout')), 10_000);
        video.onloadedmetadata = () => { clearTimeout(t); resolve(); };
      });
      await video.play();
      setStatus('active');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera error');
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return { videoRef, status, error, startCamera, stopCamera };
}
