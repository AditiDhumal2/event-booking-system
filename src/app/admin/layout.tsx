"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminMenuOption from "@/components/shared/AdminMenuOption";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          EventBook
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <AdminMenuOption
            title="Dashboard"
            href="/admin/dashboard"
          />
          <AdminMenuOption
            title="Manage Events"
            href="/admin/events"
          />
          <AdminMenuOption
            title="Users"
            href="/admin/users"
          />
          <AdminMenuOption
            title="Event Bookings"
            href="/admin/bookings"
          />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 bg-gray-100">{children}</main>
      </div>
    </div>
  );
}
