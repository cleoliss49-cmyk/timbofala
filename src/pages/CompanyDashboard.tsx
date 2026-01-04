import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  BadgeCheck,
  Save,
  Loader2,
  Phone,
  MapPin,
  PenSquare,
} from 'lucide-react';
import { 
  getCategoryLabel, 
  getCategoryIcon, 
  getApplicationStatusLabel, 
  getApplicationStatusColor,
  COMPANY_CATEGORIES,
} from '@/lib/companyCategories';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';
import { AddPortfolioDialog } from '@/components/company/AddPortfolioDialog';
import { CreateCompanyPostDialog } from '@/components/company/CreateCompanyPostDialog';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
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

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddPortfolioDialog, setShowAddPortfolioDialog] = useState(false);
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    city: '',
    neighborhood: '',
    address: '',
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
      setEditForm({
        name: companyData.name || '',
        description: companyData.description || '',
        category: companyData.category || '',
        phone: companyData.phone || '',
        whatsapp: companyData.whatsapp || '',
        email: companyData.email || '',
        website: companyData.website || '',
        instagram: companyData.instagram || '',
        facebook: companyData.facebook || '',
        linkedin: companyData.linkedin || '',
        city: companyData.city || '',
        neighborhood: companyData.neighborhood || '',
        address: companyData.address || '',
      });

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

      // Fetch portfolio
      const { data: portfolioData } = await supabase
        .from('company_portfolio')
        .select('*')
        .eq('company_id', companyData.id)
        .order('sort_order', { ascending: true });

      setPortfolio(portfolioData || []);

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

  const handleSaveProfile = async () => {
    if (!company) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: editForm.name,
          description: editForm.description || null,
          category: editForm.category,
          phone: editForm.phone || null,
          whatsapp: editForm.whatsapp || null,
          email: editForm.email || null,
          website: editForm.website || null,
          instagram: editForm.instagram || null,
          facebook: editForm.facebook || null,
          linkedin: editForm.linkedin || null,
          city: editForm.city,
          neighborhood: editForm.neighborhood || null,
          address: editForm.address || null,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'As informações da empresa foram salvas.',
      });

      fetchCompanyData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowCreatePostDialog(true)}
              >
                <PenSquare className="w-4 h-4" />
                Publicar
              </Button>
              <Link to={`/company/${company.slug}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Ver Página
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
          <TabsList className="flex-wrap h-auto">
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
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
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
                        <Link to={`/vagas/${job.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
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
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
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
                        <div className="flex gap-2 items-center">
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
                          <Select
                            value={application.status}
                            onValueChange={(value) => updateApplicationStatus(application.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="reviewed">Visualizado</SelectItem>
                              <SelectItem value="shortlisted">Pré-selecionado</SelectItem>
                              <SelectItem value="rejected">Não selecionado</SelectItem>
                              <SelectItem value="hired">Contratado</SelectItem>
                            </SelectContent>
                          </Select>
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
              <Button className="gap-2" onClick={() => setShowAddPortfolioDialog(true)}>
                <Plus className="w-4 h-4" />
                Adicionar Projeto
              </Button>
            </div>

            {portfolio.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum projeto no portfólio</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione projetos para mostrar seu trabalho.
                  </p>
                  <Button onClick={() => setShowAddPortfolioDialog(true)}>Adicionar Projeto</Button>
                </CardContent>
              </Card>
            ) : (
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
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Serviços</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </Button>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Cadastre os serviços que sua empresa oferece.
                </p>
                <Button>Adicionar Serviço</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-lg font-semibold">Configurações da Empresa</h2>

            <div className="grid gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={editForm.facebook}
                        onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={editForm.linkedin}
                        onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Select
                        value={editForm.neighborhood}
                        onValueChange={(value) => setEditForm({ ...editForm, neighborhood: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {NEIGHBORHOODS.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {company && (
        <>
          <AddPortfolioDialog
            open={showAddPortfolioDialog}
            onOpenChange={setShowAddPortfolioDialog}
            companyId={company.id}
            onProjectAdded={fetchCompanyData}
          />
          <CreateCompanyPostDialog
            open={showCreatePostDialog}
            onOpenChange={setShowCreatePostDialog}
            companyId={company.id}
            onPostCreated={fetchCompanyData}
          />
        </>
      )}
    </MainLayout>
  );
}
