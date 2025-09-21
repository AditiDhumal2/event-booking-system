'use client';

import Link from 'next/link';

interface NavbarProps {
  user: {
    name: string;
    role: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="navbar">
      <Link href="/">Home</Link>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          {user.role === 'admin' && <Link href="/admin">Admin Panel</Link>}
          <Link href="/auth/logout">Logout</Link>
        </>
      ) : (
        <Link href="/auth/login">Login</Link>
      )}
    </nav>
  );
}
