import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, Search, MapPin, CheckCircle, Truck,
  Building2, Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BusinessProfile {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  category: string;
  city: string;
  neighborhood: string | null;
  offers_delivery: boolean;
  is_verified: boolean;
}

const CATEGORIES = [
  { value: 'todos', label: 'Todas as categorias' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'moda', label: 'Moda e Vestuário' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'casa', label: 'Casa e Decoração' },
  { value: 'beleza', label: 'Beleza e Cosméticos' },
  { value: 'esportes', label: 'Esportes e Lazer' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

export default function Businesses() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Empresas de Timbó</h1>
          <p className="text-muted-foreground">
            Descubra e apoie os negócios locais da nossa comunidade
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'todos' 
                  ? 'Tente ajustar os filtros'
                  : 'Seja o primeiro a criar uma conta empresarial!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusinesses.map(business => (
              <Link key={business.id} to={`/empresa/${business.slug}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                  <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.business_name}
                        className="absolute bottom-0 left-4 w-16 h-16 rounded-xl border-4 border-background object-cover translate-y-1/2 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="absolute bottom-0 left-4 w-16 h-16 rounded-xl border-4 border-background bg-primary/20 flex items-center justify-center translate-y-1/2 group-hover:scale-105 transition-transform">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-10 pb-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold line-clamp-1">{business.business_name}</h3>
                          {business.is_verified && (
                            <CheckCircle className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {business.category}
                        </Badge>
                      </div>
                      {business.offers_delivery && (
                        <Badge variant="outline" className="gap-1 flex-shrink-0">
                          <Truck className="w-3 h-3" />
                          Entrega
                        </Badge>
                      )}
                    </div>
                    {business.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {business.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <MapPin className="w-3 h-3" />
                      {business.neighborhood ? `${business.neighborhood}, ` : ''}{business.city}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
