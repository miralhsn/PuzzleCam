'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { HandLandmark } from '../types';

type OnResultsCb = (landmarks: HandLandmark[][]) => void;

interface UseHandTrackingOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled:  boolean;
  onResults: OnResultsCb;
}

export function useHandTracking({ videoRef, enabled, onResults }: UseHandTrackingOpts) {
  const handsRef   = useRef<any>(null);
  const rafRef     = useRef<number>(0);
  const runningRef = useRef(false);
  const busyRef    = useRef(false); // prevent overlapping sends

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) { stop(); return; }

    let mounted = true;

    async function init() {
      // Poll until MediaPipe Hands is available from CDN <script>
      let attempts = 0;
      while (typeof (window as any).Hands === 'undefined' && attempts < 150) {
        await sleep(100);
        attempts++;
      }
      if (!mounted || typeof (window as any).Hands === 'undefined') {
        console.error('[HandTracking] MediaPipe Hands not available after 15s');
        return;
      }

      const Hands = (window as any).Hands;
      const hands = new Hands({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
      });

      hands.setOptions({
        maxNumHands:            2,
        modelComplexity:        1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.6,
      });

      hands.onResults((res: any) => {
        if (!mounted) return;
        busyRef.current = false;
        onResults((res.multiHandLandmarks as HandLandmark[][]) ?? []);
      });

      // Initialize the model (warms up WASM / WebGL)
      await hands.initialize();
      if (!mounted) return;

      handsRef.current = hands;
      runningRef.current = true;

      // Drive MediaPipe with our own rAF loop so we control timing
      // and don't fight with the mirror-canvas loop.
      function loop() {
        if (!runningRef.current || !mounted) return;

        const video = videoRef.current;
        // Only send if video has real frames and we're not already waiting
        if (video && video.readyState === 4 && !busyRef.current) {
          busyRef.current = true;
          hands.send({ image: video }).catch(() => { busyRef.current = false; });
        }

        // ~30 fps for tracking (33 ms interval via rAF throttle)
        rafRef.current = requestAnimationFrame(() => {
          setTimeout(loop, 33);
        });
      }
      loop();
    }

    init();
    return () => {
      mounted = false;
      stop();
    };
  }, [enabled, videoRef, stop, onResults]);
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}
