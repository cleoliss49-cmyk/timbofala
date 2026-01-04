import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Briefcase,
  BadgeCheck,
  Image,
  Wrench,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { getCategoryLabel, getCategoryIcon, getEmploymentTypeLabel, getWorkModeLabel } from '@/lib/companyCategories';

interface Company {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  is_verified: boolean;
}

interface JobListing {
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
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_type: string;
}

export default function CompanyProfile() {
  const { slug } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const isOwner = company?.user_id === user?.id;

  useEffect(() => {
    if (slug) {
      fetchCompanyData();
    }
  }, [slug]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setCompany(companyData);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('job_listings')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);

      // Fetch portfolio
      const { data: portfolioData } = await supabase
        .from('company_portfolio')
        .select('*')
        .eq('company_id', companyData.id)
        .order('sort_order', { ascending: true });

      setPortfolio(portfolioData || []);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('company_services')
        .select('*')
        .eq('company_id', companyData.id)
        .order('sort_order', { ascending: true });

      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) {
      return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`;
    }
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
    if (max) return `Até R$ ${max.toLocaleString('pt-BR')}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
            <p className="text-muted-foreground">
              A empresa que você está procurando não existe ou foi removida.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cover & Header */}
        <div className="relative">
          {company.cover_url ? (
            <div className="h-48 md:h-64 rounded-xl overflow-hidden">
              <img
                src={company.cover_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 md:h-64 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5" />
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <Avatar className="w-24 h-24 rounded-xl border-4 border-background shadow-lg">
                <AvatarImage src={company.logo_url || ''} />
                <AvatarFallback className="rounded-xl bg-background text-3xl">
                  {getCategoryIcon(company.category)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-lg p-3 md:bg-transparent md:backdrop-blur-none md:p-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{company.name}</h1>
                  {company.is_verified && (
                    <BadgeCheck className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Badge variant="secondary">
                    {getCategoryIcon(company.category)} {getCategoryLabel(company.category)}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {company.neighborhood ? `${company.neighborhood}, ` : ''}{company.city}
                  </span>
                </div>
              </div>

              {isOwner && (
                <Link to="/empresa/painel">
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Gerenciar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {company.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="jobs">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="jobs" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  Vagas ({jobs.length})
                </TabsTrigger>
                {portfolio.length > 0 && (
                  <TabsTrigger value="portfolio" className="gap-2">
                    <Image className="w-4 h-4" />
                    Portfólio
                  </TabsTrigger>
                )}
                {services.length > 0 && (
                  <TabsTrigger value="services" className="gap-2">
                    <Wrench className="w-4 h-4" />
                    Serviços
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="jobs" className="space-y-4 mt-4">
                {jobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      Nenhuma vaga disponível no momento.
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job) => (
                    <Link key={job.id} to={`/vagas/${job.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{getEmploymentTypeLabel(job.employment_type)}</Badge>
                            <Badge variant="outline">{getWorkModeLabel(job.work_mode)}</Badge>
                            {!job.hide_salary && formatSalary(job.salary_min, job.salary_max) && (
                              <Badge variant="secondary">
                                {formatSalary(job.salary_min, job.salary_max)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {job.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      {item.image_url && (
                        <div className="aspect-video">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.project_url && (
                          <a
                            href={item.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary mt-2"
                          >
                            Ver projeto <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="space-y-3">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          {service.price && (
                            <Badge variant="secondary">
                              {service.price_type === 'quote'
                                ? 'Sob consulta'
                                : `R$ ${service.price.toLocaleString('pt-BR')}${service.price_type === 'hourly' ? '/hora' : ''}`}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4" />
                    {company.phone}
                  </a>
                )}
                {company.whatsapp && (
                  <a
                    href={`https://wa.me/55${company.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Mail className="w-4 h-4" />
                    {company.email}
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Social */}
            {(company.instagram || company.facebook || company.linkedin) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Redes Sociais</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  {company.instagram && (
                    <a
                      href={`https://instagram.com/${company.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {company.facebook && (
                    <a
                      href={`https://facebook.com/${company.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {company.linkedin && (
                    <a
                      href={`https://linkedin.com/company/${company.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Address */}
            {company.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Endereço</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {company.address}
                    <br />
                    {company.neighborhood && `${company.neighborhood}, `}{company.city}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
