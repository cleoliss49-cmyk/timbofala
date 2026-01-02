import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export function OrderNotificationListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playOrderSound } = useNotificationSound();
  const businessIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // First, check if user has a business profile
    const checkBusinessProfile = async () => {
      const { data } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        businessIdRef.current = data.id;
        setupRealtimeSubscription(data.id);
      }
    };

    checkBusinessProfile();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  const setupRealtimeSubscription = (businessId: string) => {
    channelRef.current = supabase
      .channel(`order-notifications-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_orders',
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          console.log('New order received:', payload);
          
          // Play sound
          playOrderSound();

          // Fetch customer info
          const { data: customer } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', (payload.new as any).customer_id)
            .single();

          // Show toast notification
          toast({
            title: '🛒 Novo Pedido!',
            description: `${customer?.full_name || 'Cliente'} fez um pedido - ${(payload.new as any).order_number}`,
            duration: 10000,
          });

          // Also create a notification in the database
          await supabase
            .from('notifications')
            .insert({
              user_id: user!.id,
              type: 'order',
              title: 'Novo pedido recebido!',
              message: `Pedido ${(payload.new as any).order_number} de ${customer?.full_name || 'Cliente'}`,
              actor_id: (payload.new as any).customer_id
            });
        }
      )
      .subscribe();
  };

  return null;
}
