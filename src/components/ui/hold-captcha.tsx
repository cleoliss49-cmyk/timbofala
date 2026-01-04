import { useState, useRef, useCallback } from 'react';
import { CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoldCaptchaProps {
  onVerified: () => void;
  className?: string;
}

export function HoldCaptcha({ onVerified, className }: HoldCaptchaProps) {
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const [holding, setHolding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdDuration = 3000; // 3 seconds
  const updateInterval = 30; // Update every 30ms for smooth animation

  const startHold = useCallback(() => {
    if (verified) return;
    
    setHolding(true);
    setProgress(0);
    
    const startTime = Date.now();
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setVerified(true);
        setHolding(false);
        onVerified();
      }
    }, updateInterval);
  }, [verified, onVerified]);

  const stopHold = useCallback(() => {
    if (verified) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setHolding(false);
    setProgress(0);
  }, [verified]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificação de segurança</span>
      </div>
      
      <div
        className={cn(
          "relative w-full h-14 rounded-xl border-2 overflow-hidden cursor-pointer select-none transition-all duration-200",
          verified 
            ? "border-green-500 bg-green-500/10" 
            : holding 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 bg-card"
        )}
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
      >
        {/* Progress bar */}
        <div 
          className={cn(
            "absolute inset-y-0 left-0 transition-all",
            verified ? "bg-green-500/30" : "bg-primary/20"
          )}
          style={{ width: `${progress}%` }}
        />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {verified ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-500">Verificação realizada</span>
            </>
          ) : holding ? (
            <>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="font-medium text-primary">Continue segurando...</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-muted-foreground">Clique e segure para verificar</span>
            </>
          )}
        </div>
      </div>
      
      {!verified && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Segure por 3 segundos para confirmar que você é humano
        </p>
      )}
    </div>
  );
}
