import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Arca Încărcare',
  description: 'Încărcați fotografii înainte și după pentru pacienți',
  manifest: '/upload-station-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arca Încărcare',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function UploadStationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
