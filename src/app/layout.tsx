import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Tarek Omar Design — Spaces Designed Around You',
    template: '%s · Tarek Omar Design',
  },
  description:
    'Interior architecture and bespoke kitchens. Design, explore and experience your space before it exists with TOD Studio, our browser-based 3D interior planner.',
  keywords: [
    'interior design',
    'kitchen design',
    'Cairo',
    '3D kitchen planner',
    'interior architecture',
  ],
  openGraph: {
    title: 'Tarek Omar Design',
    description: 'Design, explore and experience your space before it exists.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f7f5f1',
  width: 'device-width',
  initialScale: 1,
  // The Studio is a full-viewport application; let it own the safe areas.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
