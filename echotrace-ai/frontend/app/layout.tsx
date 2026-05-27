import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EchoTrace AI — Wireless Human Presence Sensing',
  description:
    'Next-generation AI-powered wireless sensing platform using Bluetooth RSSI analysis for human presence and movement detection.',
  keywords: ['AI', 'wireless sensing', 'Bluetooth', 'RSSI', 'occupancy detection', 'IoT'],
  authors: [{ name: 'EchoTrace AI' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020817',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}
