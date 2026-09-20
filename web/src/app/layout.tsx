import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Grievia — Campus Grievance Management',
  description:
    'AI-assisted campus grievance management and automatic escalation platform for SNS College of Technology.',
  icons: {
    icon: '/SNSCT.png',
    shortcut: '/SNSCT.png',
    apple: '/SNSCT.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
