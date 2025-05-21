import './globals.css';
import { IBM_Plex_Mono } from 'next/font/google';
import Script from 'next/script';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Plane Overhead',
  description: 'What’s flying above you?',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={ibmPlexMono.className}>
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
