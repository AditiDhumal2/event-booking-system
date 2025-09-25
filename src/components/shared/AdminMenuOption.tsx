'use client';

import { FC, ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminMenuOptionProps {
  title: string;
  href?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const AdminMenuOption: FC<AdminMenuOptionProps> = ({ title, href, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const isActive = href && pathname === href;

  if (children) {
    return (
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="w-full flex items-center justify-between py-2 px-3 rounded hover:bg-gray-700 focus:outline-none"
        >
          <div className="flex items-center space-x-2">
            {icon && <span>{icon}</span>}
            <span>{title}</span>
          </div>
          <span className="text-sm">{isOpen ? "▲" : "▼"}</span>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={`flex items-center py-2 px-3 rounded transition-colors ${
        isActive ? "bg-gray-700 font-semibold" : "hover:bg-gray-700"
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </Link>
  );
};

export default AdminMenuOption;
