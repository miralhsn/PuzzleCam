/**
 * Capture the current video frame as a mirrored JPEG.
 * The video element uses CSS scaleX(-1) for display, so we mirror
 * here too so the captured image matches what the user sees.
 */
export function captureFrame(video: HTMLVideoElement): string {
  const W = video.videoWidth;
  const H = video.videoHeight;
  if (!W || !H) return '';

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Mirror horizontally to match the CSS scaleX(-1) on the video
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);

  return canvas.toDataURL('image/jpeg', 0.92);
}