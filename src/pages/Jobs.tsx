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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { 
  EMPLOYMENT_TYPES, 
  WORK_MODES,
  getEmploymentTypeLabel, 
  getWorkModeLabel,
  getCategoryIcon 
} from '@/lib/companyCategories';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JobWithCompany {
  id: string;
  title: string;
  description: string;
  employment_type: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  hide_salary: boolean;
  city: string;
  neighborhood: string | null;
  created_at: string;
  companies: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    category: string;
    is_verified: boolean;
  };
}

export default function Jobs() {
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [employmentType, setEmploymentType] = useState<string>('');
  const [workMode, setWorkMode] = useState<string>('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          companies (
            id,
            name,
            slug,
            logo_url,
            category,
            is_verified
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companies.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !employmentType || job.employment_type === employmentType;
    const matchesMode = !workMode || job.work_mode === workMode;
    return matchesSearch && matchesType && matchesMode;
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) {
      return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`;
    }
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
    if (max) return `Até R$ ${max.toLocaleString('pt-BR')}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Vagas de Emprego</h1>
          <p className="text-muted-foreground">
            Encontre oportunidades de trabalho na região
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vagas ou empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tipo de vaga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={workMode} onValueChange={setWorkMode}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {WORK_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-14 h-14 rounded-lg" />
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
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery || employmentType || workMode
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há vagas publicadas'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Link key={job.id} to={`/vagas/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Avatar className="w-14 h-14 rounded-lg flex-shrink-0">
                        <AvatarImage src={job.companies.logo_url || ''} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-xl">
                          {getCategoryIcon(job.companies.category)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Link 
                                to={`/company/${job.companies.slug}`}
                                className="hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {job.companies.name}
                              </Link>
                              {job.companies.is_verified && (
                                <BadgeCheck className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </div>
                          
                          {!job.hide_salary && formatSalary(job.salary_min, job.salary_max) && (
                            <Badge variant="secondary" className="flex-shrink-0">
                              {formatSalary(job.salary_min, job.salary_max)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="w-3 h-3" />
                            {getEmploymentTypeLabel(job.employment_type)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            {getWorkModeLabel(job.work_mode)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.neighborhood ? `${job.neighborhood}, ` : ''}{job.city}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
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
