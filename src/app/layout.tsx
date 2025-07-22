
'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import * as React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const metadata: Metadata = {
  title: 'RevaDates',
  description: 'Find your perfect match with the power of AI',
};

const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Re-assigning to a variable that can be used in the component
const layoutMetadata = metadata;
const layoutViewport = viewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <title>{String(layoutMetadata.title)}</title>
        <meta name="description" content={String(layoutMetadata.description)} />
        <link rel="icon" href="/favicon.ico?v=1" sizes="any" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
