import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Puzzle Camera',
  description: 'Frame with your hands. Pinch to capture. Solve the puzzle.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        {/* No StrictMode — it double-invokes effects which corrupts the MediaPipe WebGL context */}
        {children}
      </body>
    </html>
  );
}
