import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Puzzle Camera',
  description: 'Frame with your hands. Pinch to capture. Solve the puzzle.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
