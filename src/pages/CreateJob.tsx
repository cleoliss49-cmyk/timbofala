import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { EMPLOYMENT_TYPES, WORK_MODES } from '@/lib/companyCategories';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';

export default function CreateJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    employment_type: 'full_time',
    work_mode: 'onsite',
    salary_min: '',
    salary_max: '',
    salary_type: 'monthly',
    hide_salary: false,
    city: 'Timbó',
    neighborhood: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkCompany();
  }, [user]);

  const checkCompany = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!data) {
      toast({
        title: 'Empresa não encontrada',
        description: 'Você precisa cadastrar uma empresa antes de publicar vagas.',
        variant: 'destructive',
      });
      navigate('/empresa/cadastrar');
      return;
    }

    setCompanyId(data.id);
    setCheckingCompany(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (!formData.title || !formData.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e a descrição da vaga.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('job_listings').insert({
        company_id: companyId,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || null,
        benefits: formData.benefits || null,
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_type: formData.salary_type,
        hide_salary: formData.hide_salary,
        city: formData.city,
        neighborhood: formData.neighborhood || null,
      });

      if (error) throw error;

      toast({
        title: 'Vaga publicada!',
        description: 'Sua vaga foi publicada com sucesso.',
      });

      navigate('/empresa/painel');
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Erro ao publicar',
        description: 'Ocorreu um erro ao publicar a vaga.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingCompany) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Publicar Vaga</h1>
          <p className="text-muted-foreground">
            Publique uma nova vaga de emprego para sua empresa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Vaga</CardTitle>
              <CardDescription>Dados principais da vaga</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Vaga *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Desenvolvedor Full Stack"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Tipo de Contratação</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_mode">Modalidade</Label>
                  <Select
                    value={formData.work_mode}
                    onValueChange={(value) => setFormData({ ...formData, work_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Vaga *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva as atividades e responsabilidades da vaga..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Liste os requisitos e qualificações necessárias..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Liste os benefícios oferecidos..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card>
            <CardHeader>
              <CardTitle>Salário</CardTitle>
              <CardDescription>Informações sobre remuneração (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ocultar salário</Label>
                  <p className="text-sm text-muted-foreground">
                    O salário não será exibido na vaga
                  </p>
                </div>
                <Switch
                  checked={formData.hide_salary}
                  onCheckedChange={(checked) => setFormData({ ...formData, hide_salary: checked })}
                />
              </div>

              {!formData.hide_salary && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary_min">Salário Mínimo</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                        placeholder="2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_max">Salário Máximo</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_type">Tipo</Label>
                      <Select
                        value={formData.salary_type}
                        onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="hourly">Por Hora</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>Onde será o trabalho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Timbó"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Select
                    value={formData.neighborhood}
                    onValueChange={(value) => setFormData({ ...formData, neighborhood: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o bairro" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEIGHBORHOODS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Vaga'
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
