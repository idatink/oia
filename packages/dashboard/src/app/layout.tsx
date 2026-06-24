import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIA Clinic Dashboard',
  description: 'Internal dashboard for NIA clinic coordinators and surgeons.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
