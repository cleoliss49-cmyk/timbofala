import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

type OpeningHours = {
  [day: string]: {
    open: string;
    close: string;
    /** compat: versão antiga */
    closed?: boolean;
    /** compat: StoreHoursEditor */
    enabled?: boolean;
  };
};

interface StoreHoursIndicatorProps {
  openingHours: OpeningHours | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const DAY_MAP: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function StoreHoursIndicator({
  openingHours,
  showLabel = true,
  size = 'md',
}: StoreHoursIndicatorProps) {
  const { isOpen, currentHours } = useMemo(() => {
    if (!openingHours) {
      // Sem horários configurados: tratamos como aberto para não prejudicar a loja.
      return { isOpen: true, currentHours: null };
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const todayHours = openingHours[currentDay];

    const isClosed =
      !todayHours || todayHours.closed === true || todayHours.enabled === false;

    if (isClosed) {
      return { isOpen: false, currentHours: null };
    }

    const openTime = parseInt(todayHours.open.replace(':', ''), 10);
    const closeTime = parseInt(todayHours.close.replace(':', ''), 10);

    const isCurrentlyOpen = currentTime >= openTime && currentTime < closeTime;

    return {
      isOpen: isCurrentlyOpen,
      currentHours: todayHours,
    };
  }, [openingHours]);

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const dotClass = isOpen ? 'bg-secondary' : 'bg-destructive';
  const badgeClass = isOpen
    ? 'border-secondary/30 text-secondary bg-secondary/10'
    : 'border-destructive/30 text-destructive bg-destructive/10';

  if (!showLabel) {
    return <div className={`${dotSize} rounded-full ${dotClass} animate-pulse`} />;
  }

  return (
    <Badge variant="outline" className={`gap-1.5 ${textSize} ${badgeClass}`}>
      <div className={`${dotSize} rounded-full ${dotClass}`} />
      {isOpen ? 'Loja aberta' : 'Loja fechada'}
      {currentHours && isOpen && (
        <span className="text-muted-foreground ml-1">até {currentHours.close}</span>
      )}
    </Badge>
  );
}

