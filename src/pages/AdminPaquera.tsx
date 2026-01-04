import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Heart,
  Users,
  Search,
  Check,
  X,
  Clock,
  CreditCard,
  Eye,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ArrowLeft,
  Shield,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaqueraProfile {
  id: string;
  user_id: string;
  photo_url: string;
  gender: string;
  looking_for_gender: string;
  city: string;
  bio: string;
  is_active: boolean;
  created_at: string;
  sexual_orientation: string;
  hobbies: string[];
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  subscription?: {
    id: string;
    status: string;
    interactions_count: number;
    interactions_limit: number;
    expires_at: string | null;
  };
}

interface PaqueraPayment {
  id: string;
  paquera_profile_id: string;
  user_id: string;
  amount: number;
  receipt_url: string;
  pix_identifier: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    photo_url: string;
    profiles?: {
      full_name: string;
      username: string;
    };
  };
}

interface Stats {
  totalProfiles: number;
  activeProfiles: number;
  maleProfiles: number;
  femaleProfiles: number;
  otherProfiles: number;
  pendingPayments: number;
  totalMatches: number;
  activeSubscriptions: number;
}

export default function AdminPaquera() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<PaqueraProfile[]>([]);
  const [payments, setPayments] = useState<PaqueraPayment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProfiles: 0,
    activeProfiles: 0,
    maleProfiles: 0,
    femaleProfiles: 0,
    otherProfiles: 0,
    pendingPayments: 0,
    totalMatches: 0,
    activeSubscriptions: 0,
  });
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaqueraPayment | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PaqueraProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admtbo');
    } else if (user) {
      checkAdminAndFetch();
    }
  }, [user, authLoading]);

  const checkAdminAndFetch = async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Acesso negado', variant: 'destructive' });
      await signOut();
      navigate('/admtbo');
      return;
    }

    await fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchPayments(), fetchStats()]);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data: paqueraProfiles, error } = await supabase
      .from('paquera_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (paqueraProfiles && paqueraProfiles.length > 0) {
      const userIds = paqueraProfiles.map((p) => p.user_id);
      const profileIds = paqueraProfiles.map((p) => p.id);

      const [userProfilesRes, subscriptionsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', userIds),
        supabase.from('paquera_subscriptions').select('*').in('paquera_profile_id', profileIds),
      ]);

      const enriched = paqueraProfiles.map((p) => ({
        ...p,
        profiles: userProfilesRes.data?.find((up) => up.id === p.user_id),
        subscription: subscriptionsRes.data?.find((s) => s.paquera_profile_id === p.id),
      }));

      setProfiles(enriched);
    } else {
      setProfiles([]);
    }
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('paquera_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }

    if (data && data.length > 0) {
      const profileIds = data.map((p) => p.paquera_profile_id);

      const { data: paqueraProfiles } = await supabase
        .from('paquera_profiles')
        .select('id, photo_url, user_id')
        .in('id', profileIds);

      const userIds = paqueraProfiles?.map((p) => p.user_id) || [];

      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      const enriched = data.map((payment) => {
        const paqueraProfile = paqueraProfiles?.find((p) => p.id === payment.paquera_profile_id);
        const userProfile = userProfiles?.find((up) => up.id === paqueraProfile?.user_id);
        return {
          ...payment,
          profile: {
            photo_url: paqueraProfile?.photo_url,
            profiles: userProfile,
          },
        };
      });

      setPayments(enriched);
    } else {
      setPayments([]);
    }
  };

  const fetchStats = async () => {
    const { data: allProfiles } = await supabase.from('paquera_profiles').select('id, gender, is_active');

    const { count: pendingPayments } = await supabase
      .from('paquera_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: totalMatches } = await supabase
      .from('paquera_matches')
      .select('*', { count: 'exact', head: true });

    const { count: activeSubscriptions } = await supabase
      .from('paquera_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (allProfiles) {
      setStats({
        totalProfiles: allProfiles.length,
        activeProfiles: allProfiles.filter((p) => p.is_active).length,
        maleProfiles: allProfiles.filter((p) => p.gender === 'male').length,
        femaleProfiles: allProfiles.filter((p) => p.gender === 'female').length,
        otherProfiles: allProfiles.filter((p) => p.gender === 'other').length,
        pendingPayments: pendingPayments || 0,
        totalMatches: totalMatches || 0,
        activeSubscriptions: activeSubscriptions || 0,
      });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_paquera_payment', {
        p_payment_id: paymentId,
        p_days: 30,
      });

      if (error) throw error;

      toast({
        title: 'Pagamento aprovado!',
        description: 'O usuário agora tem acesso por 30 dias.',
      });

      setShowReceiptDialog(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    }
    setProcessing(false);
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_paquera_payment', {
        p_payment_id: paymentId,
        p_reason: rejectionReason,
      });

      if (error) throw error;

      toast({
        title: 'Pagamento rejeitado',
        description: 'O usuário foi notificado.',
      });

      setShowReceiptDialog(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    }
    setProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'ID copiado!', description: text });
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.subscription?.status === 'active') ||
      (statusFilter === 'pending' && (!p.subscription || p.subscription.status === 'pending')) ||
      (statusFilter === 'expired' && p.subscription?.status === 'expired');
    const matchesSearch =
      !searchTerm ||
      p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesGender && matchesStatus && matchesSearch;
  });

  const pendingPaymentsList = payments.filter((p) => p.status === 'pending');

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Feminino';
      default: return 'Outro';
    }
  };

  const getStatusBadge = (subscription?: PaqueraProfile['subscription']) => {
    if (!subscription) return <Badge variant="outline">Novo</Badge>;
    switch (subscription.status) {
      case 'active': return <Badge className="bg-green-500">Ativo</Badge>;
      case 'pending': return <Badge variant="secondary">Pendente</Badge>;
      case 'expired': return <Badge variant="destructive">Expirado</Badge>;
      case 'blocked': return <Badge variant="destructive">Bloqueado</Badge>;
      default: return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-500/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Gestão do Paquera</h1>
              <p className="text-xs text-muted-foreground">Administração de perfis e pagamentos</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalProfiles}</p>
                  <p className="text-sm text-muted-foreground">Perfis Cadastrados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Matches Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="font-medium">Masculino: {stats.maleProfiles}</span>
                <span className="text-muted-foreground">({stats.totalProfiles > 0 ? Math.round((stats.maleProfiles / stats.totalProfiles) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-pink-500" />
                <span className="font-medium">Feminino: {stats.femaleProfiles}</span>
                <span className="text-muted-foreground">({stats.totalProfiles > 0 ? Math.round((stats.femaleProfiles / stats.totalProfiles) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span className="font-medium">Outro: {stats.otherProfiles}</span>
                <span className="text-muted-foreground">({stats.totalProfiles > 0 ? Math.round((stats.otherProfiles / stats.totalProfiles) * 100) : 0}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profiles">
          <TabsList className="mb-4">
            <TabsTrigger value="profiles">
              <Users className="w-4 h-4 mr-2" />
              Perfis ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="relative">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagamentos
              {pendingPaymentsList.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingPaymentsList.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <CardTitle>Perfis Paquera</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Foto</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Gênero</TableHead>
                        <TableHead>Procura</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Interações</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(profile.id)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={profile.photo_url} />
                              <AvatarFallback>
                                {profile.profiles?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{profile.profiles?.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{profile.profiles?.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getGenderLabel(profile.gender)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getGenderLabel(profile.looking_for_gender)}</Badge>
                          </TableCell>
                          <TableCell>{profile.city}</TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {profile.subscription?.interactions_count || 0}/
                              {profile.subscription?.interactions_limit || 10}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(profile.subscription)}</TableCell>
                          <TableCell>
                            {profile.subscription?.expires_at
                              ? format(new Date(profile.subscription.expires_at), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProfile(profile);
                                setShowProfileDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Comprovantes de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID PIX</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comprovante</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum pagamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono font-bold text-primary">
                              {payment.pix_identifier}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={payment.profile?.photo_url} />
                                  <AvatarFallback>
                                    {payment.profile?.profiles?.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{payment.profile?.profiles?.full_name}</p>
                                  <p className="text-xs text-muted-foreground">@{payment.profile?.profiles?.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>R$ {payment.amount.toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell>
                              {payment.status === 'pending' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pendente
                                </Badge>
                              )}
                              {payment.status === 'approved' && (
                                <Badge className="bg-green-500 gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Aprovado
                                </Badge>
                              )}
                              {payment.status === 'rejected' && (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Rejeitado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowReceiptDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                            <TableCell>
                              {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {payment.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setShowReceiptDialog(true);
                                    }}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Details Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes do Perfil Paquera
            </DialogTitle>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedProfile.photo_url} />
                  <AvatarFallback className="text-2xl">
                    {selectedProfile.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedProfile.profiles?.full_name}</h3>
                  <p className="text-muted-foreground">@{selectedProfile.profiles?.username}</p>
                  {getStatusBadge(selectedProfile.subscription)}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Completo:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                      {selectedProfile.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(selectedProfile.id)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gênero:</span>
                  <span>{getGenderLabel(selectedProfile.gender)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Procurando:</span>
                  <span>{getGenderLabel(selectedProfile.looking_for_gender)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orientação:</span>
                  <span className="capitalize">{selectedProfile.sexual_orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cidade:</span>
                  <span>{selectedProfile.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interações:</span>
                  <span className="font-mono">
                    {selectedProfile.subscription?.interactions_count || 0} / 
                    {selectedProfile.subscription?.interactions_limit || 10}
                  </span>
                </div>
                {selectedProfile.subscription?.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expira em:</span>
                    <span>{format(new Date(selectedProfile.subscription.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cadastro:</span>
                  <span>{format(new Date(selectedProfile.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
              </div>

              {selectedProfile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selectedProfile.bio}</p>
                </div>
              )}

              {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Hobbies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.hobbies.map((hobby, i) => (
                      <Badge key={i} variant="secondary">{hobby}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedProfile.photo_url}
                  alt="Foto do perfil"
                  className="w-full max-h-[300px] object-cover"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/profile/${selectedProfile.profiles?.username}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Perfil Completo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Comprovante de Pagamento
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID PIX:</span>
                  <span className="font-mono font-bold text-primary">{selectedPayment.pix_identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuário:</span>
                  <span>{selectedPayment.profile?.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold">R$ {selectedPayment.amount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{format(new Date(selectedPayment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedPayment.receipt_url}
                  alt="Comprovante"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>

              {selectedPayment.status === 'pending' && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Motivo da rejeição (se aplicável):</label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ex: Comprovante ilegível, valor incorreto..."
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectPayment(selectedPayment.id)}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprovePayment(selectedPayment.id)}
                      disabled={processing}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Liberar (30 dias)
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selectedPayment.status === 'rejected' && selectedPayment.rejection_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Motivo da rejeição:</strong> {selectedPayment.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
