import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  BadgeCheck,
  FileText,
  Send,
  Loader2,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { getEmploymentTypeLabel, getWorkModeLabel, getCategoryIcon, getCategoryLabel } from '@/lib/companyCategories';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JobWithCompany {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  employment_type: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: string;
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
    description: string | null;
  };
}

export default function JobDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  useEffect(() => {
    if (user && job) {
      checkExistingApplication();
    }
  }, [user, job]);

  useEffect(() => {
    if (profile) {
      setApplicationData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
      }));
    }
    if (user) {
      setApplicationData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [profile, user]);

  const fetchJobDetails = async () => {
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
            is_verified,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    if (!user || !job) return;

    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('user_id', user.id)
      .single();

    setHasApplied(!!data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Formato inválido',
          description: 'Apenas arquivos PDF são aceitos.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleApply = async () => {
    if (!user || !job || !resumeFile) return;

    if (!applicationData.fullName || !applicationData.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha seu nome e e-mail.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload resume
      const fileName = `${user.id}/${Date.now()}-${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Create application
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: user.id,
          full_name: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone || null,
          resume_url: publicUrl,
          cover_letter: applicationData.coverLetter || null,
        });

      if (applicationError) throw applicationError;

      setHasApplied(true);
      setApplyDialogOpen(false);
      toast({
        title: 'Candidatura enviada!',
        description: 'Sua candidatura foi enviada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error applying:', error);
      toast({
        title: 'Erro ao candidatar',
        description: error.message || 'Ocorreu um erro ao enviar sua candidatura.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return null;
    const suffix = type === 'hourly' ? '/hora' : type === 'yearly' ? '/ano' : '/mês';
    if (min && max) {
      return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}${suffix}`;
    }
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}${suffix}`;
    if (max) return `Até R$ ${max.toLocaleString('pt-BR')}${suffix}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vaga não encontrada</h2>
            <p className="text-muted-foreground">
              A vaga que você está procurando não existe ou foi removida.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Link to={`/company/${job.companies.slug}`}>
                <Avatar className="w-16 h-16 rounded-lg">
                  <AvatarImage src={job.companies.logo_url || ''} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-2xl">
                    {getCategoryIcon(job.companies.category)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1">
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Link
                    to={`/company/${job.companies.slug}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {job.companies.name}
                  </Link>
                  {job.companies.is_verified && (
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
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

                {!job.hide_salary && formatSalary(job.salary_min, job.salary_max, job.salary_type) && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-base">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                    </Badge>
                  </div>
                )}

                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Publicada {formatDistanceToNow(new Date(job.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-6 pt-6 border-t">
              {!user ? (
                <Link to="/auth">
                  <Button className="w-full md:w-auto gap-2">
                    <Send className="w-4 h-4" />
                    Entrar para se candidatar
                  </Button>
                </Link>
              ) : hasApplied ? (
                <Button disabled className="w-full md:w-auto gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Candidatura enviada
                </Button>
              ) : (
                <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto gap-2">
                      <Send className="w-4 h-4" />
                      Candidatar-se
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Candidatar-se à vaga</DialogTitle>
                      <DialogDescription>
                        Preencha seus dados e envie seu currículo em PDF.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo *</Label>
                        <Input
                          id="fullName"
                          value={applicationData.fullName}
                          onChange={(e) =>
                            setApplicationData({ ...applicationData, fullName: e.target.value })
                          }
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={applicationData.email}
                          onChange={(e) =>
                            setApplicationData({ ...applicationData, email: e.target.value })
                          }
                          placeholder="seu@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={applicationData.phone}
                          onChange={(e) =>
                            setApplicationData({ ...applicationData, phone: e.target.value })
                          }
                          placeholder="(47) 90000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resume">Currículo (PDF) *</Label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <Input
                              id="resume"
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <div className="border rounded-md p-3 text-center cursor-pointer hover:bg-muted transition-colors">
                              {resumeFile ? (
                                <div className="flex items-center justify-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm truncate">{resumeFile.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                  <Upload className="w-4 h-4" />
                                  <span className="text-sm">Clique para enviar PDF</span>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Máximo 5MB
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">Carta de apresentação</Label>
                        <Textarea
                          id="coverLetter"
                          value={applicationData.coverLetter}
                          onChange={(e) =>
                            setApplicationData({ ...applicationData, coverLetter: e.target.value })
                          }
                          placeholder="Conte um pouco sobre você e por que se interessou pela vaga..."
                          rows={4}
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleApply}
                        disabled={submitting || !resumeFile}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Candidatura
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição da Vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>

        {/* Requirements */}
        {job.requirements && (
          <Card>
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Card>
            <CardHeader>
              <CardTitle>Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.benefits}</p>
            </CardContent>
          </Card>
        )}

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre a Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/company/${job.companies.slug}`} className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 rounded-lg">
                <AvatarImage src={job.companies.logo_url || ''} />
                <AvatarFallback className="rounded-lg bg-primary/10">
                  {getCategoryIcon(job.companies.category)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{job.companies.name}</span>
                  {job.companies.is_verified && (
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  )}
                </div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {getCategoryIcon(job.companies.category)} {getCategoryLabel(job.companies.category)}
                </Badge>
              </div>
            </Link>
            {job.companies.description && (
              <p className="text-sm text-muted-foreground">{job.companies.description}</p>
            )}
            <Link to={`/company/${job.companies.slug}`}>
              <Button variant="outline" size="sm" className="mt-3">
                Ver perfil da empresa
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
