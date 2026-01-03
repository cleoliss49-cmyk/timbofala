import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OrdersBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchPendingOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_orders',
          filter: `customer_id=eq.${user.id}`
        },
        () => {
          fetchPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPendingOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('business_orders')
      .select('id, status')
      .eq('customer_id', user.id)
      .not('status', 'in', '(delivered,cancelled)');

    if (!error && data) {
      setPendingCount(data.length);
    }
  };

  if (!user || pendingCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/meus-pedidos')}
          className="relative"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{pendingCount} pedido{pendingCount !== 1 ? 's' : ''} em andamento</p>
      </TooltipContent>
    </Tooltip>
  );
}
