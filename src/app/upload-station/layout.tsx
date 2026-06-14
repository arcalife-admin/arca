import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Arca Upload',
  description: 'Upload before and after photos for patients',
  manifest: '/upload-station-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arca Upload',
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
