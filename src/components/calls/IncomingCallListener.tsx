import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCall {
  id: string;
  caller_id: string;
  call_type: 'voice' | 'video';
  callerProfile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface IncomingCallDialogProps {
  onAccept: (callId: string, callerId: string, callerName: string, callerAvatar: string | null, callType: 'voice' | 'video') => void;
}

export function IncomingCallListener({ onAccept }: IncomingCallDialogProps) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const a = new Audio('/ringtone.mp3');
      a.loop = true;
      return a;
    }
    return null;
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          if (call.status === 'calling') {
            // Fetch caller profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', call.caller_id)
              .single();

            setIncomingCall({
              id: call.id,
              caller_id: call.caller_id,
              call_type: call.call_type,
              callerProfile: profile || undefined,
            });

            // Play ringtone
            audio?.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      audio?.pause();
    };
  }, [user, audio]);

  const handleAccept = async () => {
    if (!incomingCall) return;

    // Stop ringtone
    audio?.pause();
    audio && (audio.currentTime = 0);

    // Update call status
    await supabase
      .from('call_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', incomingCall.id);

    onAccept(
      incomingCall.id,
      incomingCall.caller_id,
      incomingCall.callerProfile?.full_name || 'Usuário',
      incomingCall.callerProfile?.avatar_url || null,
      incomingCall.call_type
    );

    setIncomingCall(null);
  };

  const handleReject = async () => {
    if (!incomingCall) return;

    // Stop ringtone
    audio?.pause();
    audio && (audio.currentTime = 0);

    // Update call status
    await supabase
      .from('call_sessions')
      .update({ status: 'rejected', ended_at: new Date().toISOString() })
      .eq('id', incomingCall.id);

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center">
      <div className="bg-card rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
        <div className="text-center">
          <div className="relative mb-6">
            <Avatar className="w-28 h-28 mx-auto ring-4 ring-primary animate-pulse">
              <AvatarImage src={incomingCall.callerProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl gradient-primary text-primary-foreground">
                {incomingCall.callerProfile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="px-3 py-1 bg-primary rounded-full text-primary-foreground text-sm font-medium flex items-center gap-1">
                {incomingCall.call_type === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                {incomingCall.call_type === 'video' ? 'Vídeo' : 'Voz'}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-1">
            {incomingCall.callerProfile?.full_name || 'Chamada recebida'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {incomingCall.call_type === 'video' ? 'Chamada de vídeo' : 'Chamada de voz'}
          </p>

          <div className="flex items-center justify-center gap-6">
            <Button
              variant="destructive"
              size="icon"
              className="w-16 h-16 rounded-full"
              onClick={handleReject}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            <Button
              size="icon"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
              onClick={handleAccept}
            >
              {incomingCall.call_type === 'video' ? (
                <Video className="w-7 h-7" />
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
