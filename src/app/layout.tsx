import { Geist, Geist_Mono } from 'next/font/google';

import { SelectionsProvider } from '@/contexts/SelectionsContext';

import type { Metadata } from 'next';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Car Selector App',
  description: 'Technical test for car selection application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SelectionsProvider>
          {children}
        </SelectionsProvider>
      </body>
    </html>
  );
}
