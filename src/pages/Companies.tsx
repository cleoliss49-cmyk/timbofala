import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  MapPin, 
  Building2, 
  Plus,
  BadgeCheck,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { COMPANY_CATEGORIES, getCategoryLabel, getCategoryIcon } from '@/lib/companyCategories';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  category: string;
  city: string;
  neighborhood: string | null;
  is_verified: boolean;
  job_count?: number;
}

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    fetchCompanies();
    if (user) {
      checkUserCompany();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get job counts for each company
      const companiesWithJobs = await Promise.all(
        (data || []).map(async (company) => {
          const { count } = await supabase
            .from('job_listings')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('is_active', true);
          
          return { ...company, job_count: count || 0 };
        })
      );

      setCompanies(companiesWithJobs);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserCompany = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    setHasCompany(!!data);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || company.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Empresas</h1>
            <p className="text-muted-foreground">
              Conheça as empresas da região e encontre vagas de emprego
            </p>
          </div>
          
          {user && !hasCompany && (
            <Link to="/empresa/cadastrar">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Cadastrar Empresa
              </Button>
            </Link>
          )}
          
          {user && hasCompany && (
            <Link to="/empresa/painel">
              <Button variant="outline" className="gap-2">
                <Building2 className="w-4 h-4" />
                Minha Empresa
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className="whitespace-nowrap"
          >
            Todas
          </Button>
          {COMPANY_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="whitespace-nowrap gap-1"
            >
              <span>{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex gap-4">
          <Link to="/vagas">
            <Button variant="outline" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Ver Vagas de Emprego
            </Button>
          </Link>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? 'Tente ajustar os filtros de busca'
                  : 'Seja o primeiro a cadastrar sua empresa!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Link key={company.id} to={`/company/${company.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 rounded-lg">
                        <AvatarImage src={company.logo_url || ''} alt={company.name} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-2xl">
                          {getCategoryIcon(company.category)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{company.name}</h3>
                          {company.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {company.neighborhood ? `${company.neighborhood}, ` : ''}{company.city}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryIcon(company.category)} {getCategoryLabel(company.category)}
                          </Badge>
                          {company.job_count && company.job_count > 0 && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Briefcase className="w-3 h-3" />
                              {company.job_count} vaga{company.job_count > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        {company.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {company.description}
                          </p>
                        )}
                      </div>
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
