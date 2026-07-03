'use client';

import { useEffect, useRef, useState } from 'react';
import type { HandLandmark } from '../types';

export type HandResultsCb = (landmarks: HandLandmark[][]) => void;
export type TrackingStatus = 'loading' | 'ready' | 'error';

const MODEL_URLS = [
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/hand_landmarker.task',
];

// Module-level singleton — survives React StrictMode double-invoke
// so MediaPipe is only ever initialised once per page load.
let globalLandmarker: any = null;
let globalInitPromise: Promise<any> | null = null;

async function getOrInitLandmarker(
  onMsg: (msg: string) => void
): Promise<any> {
  if (globalLandmarker) return globalLandmarker;
  if (globalInitPromise) return globalInitPromise;

  globalInitPromise = (async () => {
    onMsg('Importing vision library…');
    const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

    onMsg('Initializing WASM runtime…');
    const fileset = await FilesetResolver.forVisionTasks('/wasm');

    onMsg('Downloading hand model (~25 MB)…');
    let modelBuffer: ArrayBuffer | null = null;
    for (const url of MODEL_URLS) {
      try {
        const resp = await fetch(url);
        if (resp.ok) { modelBuffer = await resp.arrayBuffer(); break; }
      } catch { /* try next */ }
    }
    if (!modelBuffer || modelBuffer.byteLength < 1000) {
      throw new Error('Failed to download hand model from all sources');
    }

    onMsg('Creating hand landmarker…');
    const opts = {
      runningMode:                'VIDEO' as const,
      numHands:                   2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence:  0.6,
      minTrackingConfidence:      0.5,
    };

    let lm: any;
    try {
      lm = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: new Uint8Array(modelBuffer), delegate: 'GPU' },
        ...opts,
      });
    } catch {
      lm = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: new Uint8Array(modelBuffer), delegate: 'CPU' },
        ...opts,
      });
    }

    globalLandmarker = lm;
    return lm;
  })();

  return globalInitPromise;
}

export function useHandTracking(onResults: HandResultsCb) {
  const cbRef     = useRef<HandResultsCb>(onResults);
  cbRef.current   = onResults;
  const readyRef  = useRef(false);
  const [status,     setStatus]     = useState<TrackingStatus>('loading');
  const [loadingMsg, setLoadingMsg] = useState('Starting…');

  useEffect(() => {
    let mounted = true;

    getOrInitLandmarker((msg) => {
      if (mounted) setLoadingMsg(msg);
    }).then(() => {
      if (mounted) { readyRef.current = true; setStatus('ready'); }
    }).catch((e) => {
      console.error('[HandLandmarker]', e);
      if (mounted) {
        setStatus('error');
        setLoadingMsg(e instanceof Error ? e.message : 'Unknown error');
      }
    });

    return () => { mounted = false; };
  }, []);

  function detect(video: HTMLVideoElement, timestampMs: number): void {
    if (!readyRef.current || !globalLandmarker) return;
    if (video.readyState < 4 || video.videoWidth === 0) return;
    const results = globalLandmarker.detectForVideo(video, timestampMs);
    const lms: HandLandmark[][] = (results.landmarks ?? []).map(
      (hand: any[]) => hand.map((pt: any) => ({ x: pt.x, y: pt.y, z: pt.z ?? 0 }))
    );
    cbRef.current(lms);
  }

  return { detect, status, loadingMsg };
}