import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import PreventBackNavigation from '@/components/ui/PreventBackNavigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';

// Configure Inter font with better error handling and fallbacks
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
      // Convert MongoDB document to plain object
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
        <Header user={user} />
        <main>{children}</main>
        {user && <PreventBackNavigation />}
      </body>
    </html>
  );
}