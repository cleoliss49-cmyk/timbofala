import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BanInfo {
  isBanned: boolean;
  reason: string | null;
  expiresAt: Date | null;
}

export function useBanCheck() {
  const { user } = useAuth();
  const [banInfo, setBanInfo] = useState<BanInfo>({
    isBanned: false,
    reason: null,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkBanStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkBanStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_bans')
      .select('reason, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setBanInfo({
        isBanned: true,
        reason: data.reason,
        expiresAt: new Date(data.expires_at),
      });
    } else {
      setBanInfo({
        isBanned: false,
        reason: null,
        expiresAt: null,
      });
    }

    setLoading(false);
  };

  const formatTimeRemaining = () => {
    if (!banInfo.expiresAt) return '';
    
    const now = new Date();
    const diff = banInfo.expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirando...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} dia(s) e ${hours % 24} hora(s)`;
    }

    return `${hours}h ${minutes}min`;
  };

  return {
    ...banInfo,
    loading,
    formatTimeRemaining,
    refresh: checkBanStatus,
  };
}
