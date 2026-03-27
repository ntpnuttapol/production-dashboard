import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';
import { LinesProvider } from '@/lib/lines-context';

export const metadata: Metadata = {
  title: "Production Finishing Dashboard",
  description: "Track production, finishing, and assembly orders with pixel art style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Mali:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Nunito:ital,wght@0,300..1000;1,300..1000&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <LinesProvider>
            {children}
          </LinesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
