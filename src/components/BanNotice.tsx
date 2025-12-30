import { useBanCheck } from '@/hooks/useBanCheck';
import { Ban, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function BanNotice() {
  const { isBanned, reason, expiresAt, formatTimeRemaining } = useBanCheck();

  if (!isBanned) return null;

  return (
    <Card className="border-destructive bg-destructive/5 mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <Ban className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Conta Suspensa Temporariamente
            </h3>
            <p className="text-sm text-muted-foreground">
              Você está temporariamente impedido de publicar, curtir ou comentar.
            </p>
            {reason && (
              <p className="text-sm">
                <strong>Motivo:</strong> {reason}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Tempo restante: <strong>{formatTimeRemaining()}</strong>
              </span>
            </div>
            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expira em: {expiresAt.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
