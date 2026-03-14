import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AR Face Filter — 3D 스킨 모핑 필터',
  description: '실시간으로 얼굴 위에 3D 캐릭터 스킨이 덧씌워지는 웹 AR 필터',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AR Face Filter',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f0c29',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="overscroll-none">{children}</body>
    </html>
  );
}
