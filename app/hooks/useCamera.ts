'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onVideoMounted: (el: HTMLVideoElement | null) => void;
  status: CameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef         = useRef<HTMLVideoElement | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);

  const attachStream = useCallback(async (stream: MediaStream, video: HTMLVideoElement) => {
    pendingStreamRef.current = null;
    video.srcObject = stream;

    // Wait for metadata so videoWidth/Height are available before we start rendering
    await new Promise<void>((resolve) => {
      if (video.readyState >= 1) { resolve(); return; }
      video.onloadedmetadata = () => resolve();
    });

    try {
      await video.play();
    } catch {
      // Some browsers throw on the first play(); retry once
      await new Promise(r => setTimeout(r, 150));
      await video.play().catch(() => {});
    }
  }, []);

  const onVideoMounted = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && pendingStreamRef.current) {
      attachStream(pendingStreamRef.current, el);
    }
  }, [attachStream]);

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
      if (video) {
        await attachStream(stream, video);
      } else {
        pendingStreamRef.current = stream;
      }
      setStatus('active');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown camera error';
      setError(msg);
      setStatus('error');
    }
  }, [attachStream]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return { videoRef, onVideoMounted, status, error, startCamera, stopCamera };
}