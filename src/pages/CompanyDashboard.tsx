import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Briefcase,
  Users,
  Settings,
  Plus,
  Eye,
  FileText,
  Image,
  Wrench,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react';
import { getCategoryLabel, getCategoryIcon, getApplicationStatusLabel, getApplicationStatusColor } from '@/lib/companyCategories';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  city: string;
  is_verified: boolean;
}

interface JobListing {
  id: string;
  title: string;
  employment_type: string;
  work_mode: string;
  is_active: boolean;
  applications_count: number;
  created_at: string;
}

interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  resume_url: string;
  status: string;
  created_at: string;
  job_listings: {
    title: string;
  };
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCompanyData();
  }, [user]);

  const fetchCompanyData = async () => {
    if (!user) return;

    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyError || !companyData) {
        navigate('/empresa/cadastrar');
        return;
      }

      setCompany(companyData);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('job_listings')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);

      // Fetch applications
      const { data: applicationsData } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_listings (title)
        `)
        .in('job_id', (jobsData || []).map(j => j.id))
        .order('created_at', { ascending: false });

      setApplications(applicationsData || []);

      // Calculate stats
      setStats({
        totalJobs: jobsData?.length || 0,
        activeJobs: jobsData?.filter(j => j.is_active).length || 0,
        totalApplications: applicationsData?.length || 0,
        pendingApplications: applicationsData?.filter(a => a.status === 'pending').length || 0,
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      toast({
        title: 'Status atualizado',
        description: 'O status da candidatura foi atualizado.',
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!company) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          {company.cover_url && (
            <div className="h-32 rounded-lg overflow-hidden mb-4">
              <img
                src={company.cover_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="w-20 h-20 rounded-xl border-4 border-background -mt-10 md:-mt-12 ml-4">
              <AvatarImage src={company.logo_url || ''} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-2xl">
                {getCategoryIcon(company.category)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground">
                {getCategoryIcon(company.category)} {getCategoryLabel(company.category)} • {company.city}
              </p>
            </div>

            <div className="flex gap-2">
              <Link to={`/company/${company.slug}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Ver Página
                </Button>
              </Link>
              <Link to="/empresa/editar">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalJobs}</p>
                  <p className="text-sm text-muted-foreground">Vagas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeJobs}</p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                  <p className="text-sm text-muted-foreground">Candidaturas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Vagas
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="w-4 h-4" />
              Candidaturas
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <Image className="w-4 h-4" />
              Portfólio
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="w-4 h-4" />
              Serviços
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Vagas de Emprego</h2>
              <Link to="/empresa/vagas/nova">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Vaga
                </Button>
              </Link>
            </div>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma vaga publicada</h3>
                  <p className="text-muted-foreground mb-4">
                    Publique sua primeira vaga para receber candidaturas.
                  </p>
                  <Link to="/empresa/vagas/nova">
                    <Button>Publicar Vaga</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{job.title}</h3>
                            <Badge variant={job.is_active ? 'default' : 'secondary'}>
                              {job.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.applications_count} candidatura{job.applications_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Link to={`/empresa/vagas/${job.id}`}>
                          <Button variant="outline" size="sm">
                            Gerenciar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-lg font-semibold">Candidaturas Recebidas</h2>

            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura</h3>
                  <p className="text-muted-foreground">
                    As candidaturas às suas vagas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{application.full_name}</h3>
                            <Badge className={getApplicationStatusColor(application.status)}>
                              {getApplicationStatusLabel(application.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {application.email} • Vaga: {application.job_listings?.title}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={application.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="gap-1">
                              <FileText className="w-4 h-4" />
                              Currículo
                            </Button>
                          </a>
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="pending">Pendente</option>
                            <option value="reviewed">Visualizado</option>
                            <option value="shortlisted">Pré-selecionado</option>
                            <option value="rejected">Não selecionado</option>
                            <option value="hired">Contratado</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Portfólio</h2>
              <Link to="/empresa/portfolio/novo">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Projeto
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum projeto no portfólio</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione projetos para mostrar seu trabalho.
                </p>
                <Link to="/empresa/portfolio/novo">
                  <Button>Adicionar Projeto</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Serviços</h2>
              <Link to="/empresa/servicos/novo">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Cadastre os serviços que sua empresa oferece.
                </p>
                <Link to="/empresa/servicos/novo">
                  <Button>Adicionar Serviço</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
