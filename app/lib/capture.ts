'use client';

/**
 * Capture current webcam frame as a base64 JPEG.
 *
 * The <video> element itself is NOT CSS-transformed; the mirror
 * is done in a canvas in CameraView. So here we flip horizontally
 * so the captured photo looks like what the user sees on screen.
 */
export function captureFrame(video: HTMLVideoElement): string {
  const W = video.videoWidth;
  const H = video.videoHeight;
  if (!W || !H) return '';

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Mirror to match on-screen appearance
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);

  return canvas.toDataURL('image/jpeg', 0.92);
}
