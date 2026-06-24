import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIA — Your Cosmetic Surgery Concierge',
  description: 'Trusted, AI-powered guidance for your cosmetic surgery journey.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
