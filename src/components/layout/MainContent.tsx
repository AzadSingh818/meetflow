'use client';

import { ReactNode } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Header from '@/components/layout/Header';

interface MainContentProps {
  children: ReactNode;
}

const MainContent = ({ children }: MainContentProps) => {

  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-16'
      }`}
    >
      <Header />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MainContent;