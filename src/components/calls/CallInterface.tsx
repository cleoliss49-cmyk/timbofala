import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';

interface CallInterfaceProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
  callSessionId?: string;
  onClose: () => void;
}

export function CallInterface({
  recipientId,
  recipientName,
  recipientAvatar,
  callType,
  isIncoming = false,
  callSessionId,
  onClose,
}: CallInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [callStatus, setCallStatus] = useState<'calling' | 'connecting' | 'active' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [sessionId, setSessionId] = useState(callSessionId || '');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize call
  const initializeCall = useCallback(async () => {
    if (!user) return;

    try {
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus('active');
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setDuration(d => d + 1);
        }, 1000);
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && sessionId) {
          // In a real app, send ICE candidate through signaling server
          console.log('ICE candidate:', event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('active');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          endCall();
        }
      };

      if (!isIncoming) {
        // Create call session
        const { data: session, error } = await supabase
          .from('call_sessions')
          .insert({
            caller_id: user.id,
            receiver_id: recipientId,
            call_type: callType,
            status: 'calling',
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(session.id);

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // In production, send offer through signaling server
        console.log('Offer created:', offer);
        
        // Simulate connection for demo
        setTimeout(() => {
          setCallStatus('connecting');
          setTimeout(() => {
            setCallStatus('active');
            durationIntervalRef.current = setInterval(() => {
              setDuration(d => d + 1);
            }, 1000);
          }, 2000);
        }, 1500);
      } else {
        setCallStatus('connecting');
      }
    } catch (error: any) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível iniciar a chamada',
        variant: 'destructive',
      });
      onClose();
    }
  }, [user, recipientId, callType, isIncoming, sessionId, toast, onClose]);

  // End call
  const endCall = useCallback(async () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    
    // Close peer connection
    peerConnectionRef.current?.close();
    
    // Clear timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Update call session
    if (sessionId) {
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    setCallStatus('ended');
    onClose();
  }, [sessionId, onClose]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => {
    initializeCall();
    
    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Listen for call updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`call-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'ended' || updated.status === 'rejected') {
            endCall();
          } else if (updated.status === 'active') {
            setCallStatus('active');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, endCall]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col">
      {/* Video area */}
      {callType === 'video' ? (
        <div className="flex-1 relative bg-black">
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-32 h-44 md:w-48 md:h-64 rounded-xl overflow-hidden shadow-2xl border-2 border-background">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Status overlay */}
          {callStatus !== 'active' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={recipientAvatar || undefined} />
                  <AvatarFallback className="text-2xl gradient-primary text-primary-foreground">
                    {recipientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mb-2">{recipientName}</h2>
                <p className="text-white/70 animate-pulse">
                  {callStatus === 'calling' ? 'Chamando...' : 'Conectando...'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Voice call UI */
        <div className="flex-1 flex items-center justify-center gradient-dark">
          <div className="text-center text-white">
            <div className="relative">
              <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-primary/30">
                <AvatarImage src={recipientAvatar || undefined} />
                <AvatarFallback className="text-4xl gradient-primary text-primary-foreground">
                  {recipientName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {callStatus === 'active' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-sm font-medium">
                  {formatDuration(duration)}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{recipientName}</h2>
            <p className="text-white/70">
              {callStatus === 'calling' && 'Chamando...'}
              {callStatus === 'connecting' && 'Conectando...'}
              {callStatus === 'active' && 'Chamada em andamento'}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-6 bg-card border-t border-border">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className={`w-14 h-14 rounded-full ${isMuted ? 'bg-destructive text-destructive-foreground' : ''}`}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {callType === 'video' && (
            <Button
              variant="outline"
              size="icon"
              className={`w-14 h-14 rounded-full ${isVideoOff ? 'bg-destructive text-destructive-foreground' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="w-16 h-16 rounded-full"
            onClick={endCall}
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
