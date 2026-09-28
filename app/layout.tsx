import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = { title: 'Matchplay scores – Business Club middag', icons: { icon: '/rydercup.jpg', apple: '/rydercup.jpg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#027C55', colorScheme: 'light' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="nl" data-theme="light"><body className={poppins.className}>{children}</body></html>;
}
