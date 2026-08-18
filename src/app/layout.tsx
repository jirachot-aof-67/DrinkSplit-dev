import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DrinkSplit Core - Dev & Party Platform',
  description: 'Modular platform with LINE OAuth, Phone Sync, and DrinkSplit bill calculator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
