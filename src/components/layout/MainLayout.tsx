import { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatSidebar } from './ChatSidebar';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex" />
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <Sidebar 
              className="fixed left-0 top-16 z-50 lg:hidden animate-slide-in-left" 
              onClose={() => setSidebarOpen(false)}
            />
          </>
        )}
        
        <main className="flex-1 lg:ml-64 lg:mr-80 p-4 md:p-6 pb-24 lg:pb-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
        <ChatSidebar />
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
