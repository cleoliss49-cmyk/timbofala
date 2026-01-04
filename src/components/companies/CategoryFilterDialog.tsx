import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Search, Check } from 'lucide-react';
import { COMPANY_CATEGORIES } from '@/lib/companyCategories';
import { cn } from '@/lib/utils';

interface CategoryFilterDialogProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilterDialog({ selectedCategory, onSelectCategory }: CategoryFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = COMPANY_CATEGORIES.filter(cat =>
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSelectCategory(value);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {selectedCategory ? (
            <>
              <span>{COMPANY_CATEGORIES.find(c => c.value === selectedCategory)?.icon}</span>
              <span className="hidden sm:inline">
                {COMPANY_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </span>
            </>
          ) : (
            'Categorias'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Filtrar por Categoria</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-2">
            {/* All categories option */}
            <button
              onClick={() => handleSelect('')}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                "hover:bg-accent hover:border-primary/50",
                !selectedCategory && "bg-primary/10 border-primary ring-2 ring-primary/20"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">Todas</span>
              </div>
              {!selectedCategory && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>

            {filteredCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleSelect(category.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                  "hover:bg-accent hover:border-primary/50",
                  selectedCategory === category.value && "bg-primary/10 border-primary ring-2 ring-primary/20"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl">
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{category.label}</span>
                </div>
                {selectedCategory === category.value && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {selectedCategory && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => handleSelect('')}
            >
              Limpar filtro
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
