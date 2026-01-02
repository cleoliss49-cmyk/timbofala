import { 
  Package, Utensils, Wine, Cake, Cookie, Shirt, 
  Watch, Smartphone, Home, Sparkles, MoreHorizontal,
  ShoppingBag, Leaf, PawPrint, Baby, Dumbbell,
  Car, Wrench, Book, Music, Gamepad2
} from 'lucide-react';

export interface ProductCategory {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: 'Geral', label: 'Geral', icon: Package, color: 'bg-gray-500' },
  { value: 'Alimentação', label: 'Alimentação', icon: Utensils, color: 'bg-orange-500' },
  { value: 'Bebidas', label: 'Bebidas', icon: Wine, color: 'bg-purple-500' },
  { value: 'Doces', label: 'Doces', icon: Cake, color: 'bg-pink-500' },
  { value: 'Salgados', label: 'Salgados', icon: Cookie, color: 'bg-amber-500' },
  { value: 'Roupas', label: 'Roupas', icon: Shirt, color: 'bg-blue-500' },
  { value: 'Acessórios', label: 'Acessórios', icon: Watch, color: 'bg-indigo-500' },
  { value: 'Eletrônicos', label: 'Eletrônicos', icon: Smartphone, color: 'bg-cyan-500' },
  { value: 'Casa', label: 'Casa', icon: Home, color: 'bg-teal-500' },
  { value: 'Beleza', label: 'Beleza', icon: Sparkles, color: 'bg-rose-500' },
  { value: 'Artesanato', label: 'Artesanato', icon: ShoppingBag, color: 'bg-yellow-600' },
  { value: 'Naturais', label: 'Naturais', icon: Leaf, color: 'bg-green-500' },
  { value: 'Pet', label: 'Pet', icon: PawPrint, color: 'bg-lime-500' },
  { value: 'Infantil', label: 'Infantil', icon: Baby, color: 'bg-sky-500' },
  { value: 'Esportes', label: 'Esportes', icon: Dumbbell, color: 'bg-red-500' },
  { value: 'Automotivo', label: 'Automotivo', icon: Car, color: 'bg-slate-500' },
  { value: 'Serviços', label: 'Serviços', icon: Wrench, color: 'bg-zinc-500' },
  { value: 'Livros', label: 'Livros', icon: Book, color: 'bg-emerald-500' },
  { value: 'Música', label: 'Música', icon: Music, color: 'bg-violet-500' },
  { value: 'Games', label: 'Games', icon: Gamepad2, color: 'bg-fuchsia-500' },
  { value: 'Outros', label: 'Outros', icon: MoreHorizontal, color: 'bg-neutral-500' },
];

export const getCategoryInfo = (categoryValue: string): ProductCategory => {
  return PRODUCT_CATEGORIES.find(c => c.value === categoryValue) || PRODUCT_CATEGORIES[0];
};

export const getCategoryIcon = (categoryValue: string) => {
  return getCategoryInfo(categoryValue).icon;
};

export const getCategoryColor = (categoryValue: string) => {
  return getCategoryInfo(categoryValue).color;
};
