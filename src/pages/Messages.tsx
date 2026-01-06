import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { CallInterface } from '@/components/calls/CallInterface';
import { AudioRecorder } from '@/components/chat/AudioRecorder';
import { useMessageSound } from '@/hooks/useMessageSound';
import { Send, ArrowLeft, Phone, Video, Volume2, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at: string | null;
}

interface ChatUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Conversation {
  user: ChatUser;
  lastMessage: Message | null;
  unreadCount: number;
}

interface ActiveCall {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  callType: 'voice' | 'video';
}

export default function Messages() {
  const { recipientId } = useParams<{ recipientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { playSound } = useMessageSound();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle pre-filled message from marketplace
  useEffect(() => {
    const prefillMessage = searchParams.get('message');
    if (prefillMessage) {
      setNewMessage(decodeURIComponent(prefillMessage));
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!allMessages) return;

    const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>();
    
    allMessages.forEach((msg) => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          lastMessage: msg,
          unreadCount: msg.receiver_id === user.id && !msg.read_at ? 1 : 0,
        });
      } else {
        const existing = conversationMap.get(partnerId)!;
        if (msg.receiver_id === user.id && !msg.read_at) {
          existing.unreadCount++;
        }
      }
    });

    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', partnerIds);

    if (profiles) {
      const convos: Conversation[] = profiles.map((profile) => ({
        user: profile,
        lastMessage: conversationMap.get(profile.id)?.lastMessage || null,
        unreadCount: conversationMap.get(profile.id)?.unreadCount || 0,
      }));

      convos.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bTime - aTime;
      });

      setConversations(convos);
    }

    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!user || !recipientId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', recipientId)
        .eq('receiver_id', user.id)
        .is('read_at', null);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', recipientId)
      .maybeSingle();

    if (profile) {
      setRecipient(profile);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (recipientId) {
      fetchMessages();
    }
  }, [recipientId, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Only play sound if the chat with this sender is NOT currently open
          if (!recipientId || newMsg.sender_id !== recipientId) {
            playSound();
          }
          
          if (recipientId && newMsg.sender_id === recipientId) {
            setMessages((prev) => [...prev, newMsg]);
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, playSound]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipientId || !newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const handleAudioRecording = async (audioBlob: Blob) => {
    if (!user || !recipientId) return;

    setSendingAudio(true);
    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('audio_messages')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio_messages')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          content: `🎤 Mensagem de áudio: ${publicUrl}`,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      fetchConversations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o áudio.',
        variant: 'destructive',
      });
    }
    setSendingAudio(false);
  };

  const startCall = (type: 'voice' | 'video') => {
    if (!recipient) return;
    setActiveCall({
      recipientId: recipient.id,
      recipientName: recipient.full_name,
      recipientAvatar: recipient.avatar_url,
      callType: type,
    });
  };

  const deleteConversation = async (partnerId: string) => {
    if (!user) return;

    try {
      // Delete all messages between the two users
      await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);

      toast({
        title: 'Conversa excluída',
        description: 'A conversa foi removida com sucesso.',
      });

      // If we're viewing this conversation, go back to messages list
      if (recipientId === partnerId) {
        navigate('/messages');
      }

      fetchConversations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conversa.',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('🎤 Mensagem de áudio:')) {
      const audioUrl = content.replace('🎤 Mensagem de áudio: ', '');
      return (
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          <audio controls className="h-8 max-w-[200px]">
            <source src={audioUrl} type="audio/webm" />
          </audio>
        </div>
      );
    }
    return <p>{content}</p>;
  };

  return (
    <>
      <MainLayout>
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
          <div className="bg-card rounded-2xl shadow-card border border-border h-full flex overflow-hidden">
            {/* Conversations list */}
            <div className={`w-full md:w-80 border-r border-border flex flex-col ${recipientId ? 'hidden md:flex' : ''}`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-display font-bold text-lg">Mensagens</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma conversa ainda
                  </div>
                ) : (
                  conversations.map((convo) => (
                    <div
                      key={convo.user.id}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                        recipientId === convo.user.id ? 'bg-muted' : ''
                      }`}
                    >
                      <button
                        onClick={() => navigate(`/messages/${convo.user.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarImage src={convo.user.avatar_url || undefined} />
                          <AvatarFallback className="gradient-secondary text-secondary-foreground">
                            {convo.user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{convo.user.full_name}</p>
                            {convo.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                          {convo.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {convo.lastMessage.content.startsWith('🎤') ? '🎤 Áudio' : convo.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setConversationToDelete(convo.user.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${!recipientId ? 'hidden md:flex' : ''}`}>
              {recipientId && recipient ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate('/messages')}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={recipient.avatar_url || undefined} />
                        <AvatarFallback className="gradient-secondary text-secondary-foreground">
                          {recipient.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{recipient.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{recipient.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startCall('voice')} className="hover:bg-green-500/10 hover:text-green-500">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startCall('video')} className="hover:bg-blue-500/10 hover:text-blue-500">
                        <Video className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMine ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                            {renderMessageContent(msg.content)}
                            <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={sendingAudio} />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Selecione uma conversa para começar
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>

      {activeCall && (
        <CallInterface
          recipientId={activeCall.recipientId}
          recipientName={activeCall.recipientName}
          recipientAvatar={activeCall.recipientAvatar}
          callType={activeCall.callType}
          onClose={() => setActiveCall(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir todas as mensagens desta conversa permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => conversationToDelete && deleteConversation(conversationToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}