import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Store, Plus, Construction } from 'lucide-react';

export default function Marketplace() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-premium rounded-xl flex items-center justify-center shadow-soft">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Marketplace</h1>
              <p className="text-muted-foreground text-sm">Compre e venda na sua comunidade</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-12 text-center border border-border">
          <Construction className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">Em desenvolvimento</h3>
          <p className="text-muted-foreground mb-6">
            O marketplace está sendo construído. Em breve você poderá comprar e vender produtos localmente!
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
