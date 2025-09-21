'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/content',
      label: 'Content',
      icon: '📺',
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: '👤',
    },
    {
      href: '/friends',
      label: 'Friends',
      icon: '👋',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#404040] px-4 py-2 backdrop-blur-sm">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[#ffa116] bg-[#333333] shadow-lg'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-[#333333]'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
