import type { Metadata } from 'next';
import { EB_Garamond, Work_Sans, Cinzel } from 'next/font/google';
import { SiteConfigProvider } from '@/components/SiteComponents';
import './globals.css';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cinzel',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-work-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Oia — Your Bespoke Treatment Planner',
  description: 'Bespoke surgical journeys, managed by intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${workSans.variable} ${cinzel.variable}`}>
      <body>
        <SiteConfigProvider>
          {children}
        </SiteConfigProvider>
      </body>
    </html>
  );
}
