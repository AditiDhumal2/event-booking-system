// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import PreventBackNavigation from '@/components/ui/PreventBackNavigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: 'EventBook - Book Your Events',
  description: 'Discover and book tickets for the best events',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  let user = null;

  if (token) {
    const userDoc = await getCurrentUser(token);
    if (userDoc) {
      user = {
        _id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role
      };
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* No SessionProvider - using your server actions instead */}
        <Header />
        <main>{children}</main>
        <PreventBackNavigation />
      </body>
    </html>
  );
}