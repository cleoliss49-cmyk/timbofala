import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatSidebar } from './ChatSidebar';
import { MobileNav } from './MobileNav';
import { IncomingCallListener } from '@/components/calls/IncomingCallListener';
import { CallInterface } from '@/components/calls/CallInterface';
import { OrderNotificationListener } from '@/components/business/OrderNotificationListener';

interface MainLayoutProps {
  children: ReactNode;
}

interface ActiveCall {
  callId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  callType: 'voice' | 'video';
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const navigate = useNavigate();

  const handleAcceptCall = (
    callId: string,
    callerId: string,
    callerName: string,
    callerAvatar: string | null,
    callType: 'voice' | 'video'
  ) => {
    setActiveCall({
      callId,
      recipientId: callerId,
      recipientName: callerName,
      recipientAvatar: callerAvatar,
      callType,
    });
  };

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
        
        <main className="flex-1 lg:ml-64 p-4 md:p-6 pb-24 lg:pb-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
        <ChatSidebar />
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Incoming call listener */}
      <IncomingCallListener onAccept={handleAcceptCall} />

      {/* Order notification listener */}
      <OrderNotificationListener />

      {/* Active call interface */}
      {activeCall && (
        <CallInterface
          recipientId={activeCall.recipientId}
          recipientName={activeCall.recipientName}
          recipientAvatar={activeCall.recipientAvatar}
          callType={activeCall.callType}
          isIncoming={true}
          callSessionId={activeCall.callId}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
