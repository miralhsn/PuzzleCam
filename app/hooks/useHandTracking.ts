'use client';

import { useEffect, useRef } from 'react';
import type { HandLandmark } from '../types';

type OnResultsCb = (landmarks: HandLandmark[][]) => void;

interface Opts {
  videoRef:  React.RefObject<HTMLVideoElement | null>;
  enabled:   boolean;
  onResults: OnResultsCb;
}

export function useHandTracking({ videoRef, enabled, onResults }: Opts) {
  const cbRef      = useRef<OnResultsCb>(onResults);
  const enabledRef = useRef(enabled);
  cbRef.current      = onResults;
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    let mounted   = true;
    let timerId   = 0;
    let handsInst: any = null;
    let busy      = false;

    async function init() {
      // Wait for the locally-served hands.js to define window.Hands
      let attempts = 0;
      while (typeof (window as any).Hands === 'undefined') {
        if (!mounted) return;
        if (attempts++ > 300) { console.error('[HandTracking] Hands never defined'); return; }
        await sleep(100);
      }
      if (!mounted) return;

      handsInst = new (window as any).Hands({
        // Point locateFile at our /public/mediapipe/ folder
        locateFile: (file: string) => `/mediapipe/${file}`,
      });

      handsInst.setOptions({
        maxNumHands:            2,
        modelComplexity:        1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.6,
      });

      handsInst.onResults((res: any) => {
        busy = false;
        if (mounted && enabledRef.current) {
          cbRef.current((res.multiHandLandmarks as HandLandmark[][]) ?? []);
        }
      });

      try {
        await handsInst.initialize();
      } catch (e) {
        console.error('[HandTracking] initialize() failed:', e);
        return;
      }
      if (!mounted) return;

      function loop() {
        if (!mounted) return;
        const video = videoRef.current;
        if (
          enabledRef.current &&
          video &&
          video.readyState === 4 &&
          video.videoWidth > 0 &&
          !busy
        ) {
          busy = true;
          handsInst.send({ image: video }).catch(() => { busy = false; });
        }
        timerId = window.setTimeout(loop, 33);
      }
      loop();
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(timerId);
      handsInst?.close?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once — all live values accessed via refs
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }