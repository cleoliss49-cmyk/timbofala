import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface OpeningHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

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
  6: 'saturday'
};

export function StoreHoursIndicator({ 
  openingHours, 
  showLabel = true,
  size = 'md' 
}: StoreHoursIndicatorProps) {
  const { isOpen, currentHours, nextOpen } = useMemo(() => {
    if (!openingHours) {
      return { isOpen: true, currentHours: null, nextOpen: null };
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = openingHours[currentDay];
    
    if (!todayHours || todayHours.closed) {
      // Find next open day
      let daysChecked = 0;
      let nextOpenDay = null;
      while (daysChecked < 7) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + daysChecked + 1);
        const checkDay = DAY_MAP[checkDate.getDay()];
        const checkHours = openingHours[checkDay];
        if (checkHours && !checkHours.closed) {
          nextOpenDay = checkDay;
          break;
        }
        daysChecked++;
      }
      return { 
        isOpen: false, 
        currentHours: null, 
        nextOpen: nextOpenDay 
      };
    }

    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));

    const isCurrentlyOpen = currentTime >= openTime && currentTime < closeTime;

    return {
      isOpen: isCurrentlyOpen,
      currentHours: todayHours,
      nextOpen: null
    };
  }, [openingHours]);

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (!showLabel) {
    return (
      <div className={`${dotSize} rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 ${textSize} ${
        isOpen 
          ? 'border-green-500/30 text-green-600 bg-green-500/10' 
          : 'border-red-500/30 text-red-600 bg-red-500/10'
      }`}
    >
      <div className={`${dotSize} rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      {isOpen ? 'Aberto' : 'Fechado'}
      {currentHours && isOpen && (
        <span className="text-muted-foreground ml-1">
          até {currentHours.close}
        </span>
      )}
    </Badge>
  );
}

interface StoreHoursEditorProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export function getDefaultOpeningHours(): OpeningHours {
  return {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '08:00', close: '12:00' },
    sunday: { open: '08:00', close: '12:00', closed: true }
  };
}
