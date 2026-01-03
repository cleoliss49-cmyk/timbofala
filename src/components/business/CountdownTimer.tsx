import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  startTime: string;
  estimatedMinutes: number;
  status: string;
}

export function CountdownTimer({ startTime, estimatedMinutes, status }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const estimatedEnd = start + estimatedMinutes * 60 * 1000;
      const now = Date.now();
      const remaining = estimatedEnd - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(remaining);
        setIsExpired(false);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTime, estimatedMinutes]);

  // Don't show for terminal statuses
  if (['delivered', 'cancelled', 'rejected'].includes(status)) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = Math.max(0, Math.min(100, 100 - (timeLeft / (estimatedMinutes * 60 * 1000)) * 100));

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Tempo excedido - aguarde</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Tempo previsto</span>
        </div>
        <span className="text-lg font-bold font-mono text-primary">
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
