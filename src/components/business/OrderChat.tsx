import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_from_business: boolean;
  created_at: string;
  read_at: string | null;
}

interface OrderChatProps {
  orderId: string;
  businessName: string;
  businessLogo?: string | null;
  customerName?: string;
  customerAvatar?: string | null;
  isBusinessView?: boolean;
}

export function OrderChat({ 
  orderId, 
  businessName, 
  businessLogo, 
  customerName,
  customerAvatar,
  isBusinessView = false 
}: OrderChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    setupRealtime();
    markMessagesAsRead();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          markMessagesAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('order_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          content: newMessage.trim(),
          is_from_business: isBusinessView
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[300px] border rounded-xl overflow-hidden bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/30 backdrop-blur">
        <div className="relative">
          <Avatar className="w-8 h-8 ring-2 ring-primary/20">
            <AvatarImage src={isBusinessView ? customerAvatar || '' : businessLogo || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-xs">
              {isBusinessView ? customerName?.[0] : businessName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {isBusinessView ? customerName : businessName}
          </p>
          <p className="text-xs text-muted-foreground">Chat do pedido</p>
        </div>
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs">Inicie a conversa sobre o pedido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div 
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      {isOwn && msg.read_at && ' • ✓✓'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-background/80 backdrop-blur">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-muted/50 border-0 focus-visible:ring-1"
            disabled={sending}
          />
          <Button 
            size="icon" 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
