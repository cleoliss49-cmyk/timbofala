import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Construction } from 'lucide-react';

export default function Events() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center shadow-soft">
              <Calendar className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Eventos</h1>
              <p className="text-muted-foreground text-sm">Descubra o que acontece em Timbó</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-12 text-center border border-border">
          <Construction className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">Em desenvolvimento</h3>
          <p className="text-muted-foreground mb-6">
            A seção de eventos está sendo construída. Em breve você poderá criar e descobrir eventos locais!
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
