import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NeonDB Analytics Dashboard',
  description: 'A dashboard for viewing NeonDB sessions data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gray-950">
          <main className="flex-grow">{children}</main>
        </div>
      </body>
    </html>
  );
}