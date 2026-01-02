import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PendingOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
}

export function BusinessOrdersBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playOrderSound } = useNotificationSound();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    checkBusinessProfile();
  }, [user]);

  useEffect(() => {
    if (!businessId) return;

    fetchPendingOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel(`business-orders-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_orders',
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          // Play sound and show notification
          playOrderSound();
          
          const newOrder = payload.new as any;
          
          // Fetch customer name
          const { data: customer } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newOrder.customer_id)
            .single();

          toast({
            title: '🛒 Novo Pedido Recebido!',
            description: `${customer?.full_name || 'Cliente'} - ${newOrder.order_number} - R$ ${newOrder.total.toFixed(2)}`,
            duration: 10000,
          });

          fetchPendingOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_orders',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const checkBusinessProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setBusinessId(data.id);
    }
  };

  const fetchPendingOrders = async () => {
    if (!businessId) return;

    const { data, error } = await supabase
      .from('business_orders')
      .select('id, order_number, status, created_at, total')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Check if we have new orders
      if (data.length > previousCountRef.current && previousCountRef.current > 0) {
        playOrderSound();
      }
      previousCountRef.current = data.length;
      
      setNewOrdersCount(data.length);
      setPendingOrders(data);
    }
  };

  if (!user || !businessId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Package className="w-5 h-5" />
          {newOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {newOrdersCount > 9 ? '9+' : newOrdersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2 border-b">
          <p className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {newOrdersCount > 0 
              ? `${newOrdersCount} Novo${newOrdersCount !== 1 ? 's' : ''} Pedido${newOrdersCount !== 1 ? 's' : ''}`
              : 'Nenhum pedido pendente'
            }
          </p>
        </div>
        {pendingOrders.length > 0 ? (
          <>
            {pendingOrders.slice(0, 5).map((order) => (
              <DropdownMenuItem
                key={order.id}
                onClick={() => navigate('/empresa/gerenciar')}
                className="flex flex-col items-start gap-1 py-3"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{order.order_number}</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                    Pendente
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  R$ {order.total.toFixed(2)}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => navigate('/empresa/gerenciar')}
              className="text-center text-primary font-medium"
            >
              Ver todos os pedidos →
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhum pedido pendente no momento
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
