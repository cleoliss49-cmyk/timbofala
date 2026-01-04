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
  RefreshCw,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ArrowLeft,
  Copy,
  ExternalLink,
  Unlock,
  Crown,
  Pause,
  Gift,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
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
    approved_at: string | null;
    created_at: string;
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
  freePhase: number;
  pausedUsers: number;
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
    freePhase: 0,
    pausedUsers: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaqueraPayment | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PaqueraProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportProfile, setReportProfile] = useState<PaqueraProfile | null>(null);
  const [userPaymentHistory, setUserPaymentHistory] = useState<PaqueraPayment[]>([]);

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
    const { data: subscriptions } = await supabase.from('paquera_subscriptions').select('*');

    const { count: pendingPayments } = await supabase
      .from('paquera_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: totalMatches } = await supabase
      .from('paquera_matches')
      .select('*', { count: 'exact', head: true });

    const now = new Date();
    const activeSubscriptions = subscriptions?.filter(
      (s) => s.status === 'active' && s.expires_at && new Date(s.expires_at) > now
    ).length || 0;

    const freePhase = allProfiles?.filter((p) => {
      const sub = subscriptions?.find((s) => s.paquera_profile_id === p.id);
      return !sub || (sub.interactions_count < sub.interactions_limit && sub.status !== 'active');
    }).length || 0;

    const pausedUsers = subscriptions?.filter((s) => {
      const isExpired = s.expires_at && new Date(s.expires_at) < now;
      const reachedLimit = s.interactions_count >= s.interactions_limit && s.status !== 'active';
      return isExpired || reachedLimit;
    }).length || 0;

    if (allProfiles) {
      setStats({
        totalProfiles: allProfiles.length,
        activeProfiles: allProfiles.filter((p) => p.is_active).length,
        maleProfiles: allProfiles.filter((p) => p.gender === 'male').length,
        femaleProfiles: allProfiles.filter((p) => p.gender === 'female').length,
        otherProfiles: allProfiles.filter((p) => p.gender === 'other').length,
        pendingPayments: pendingPayments || 0,
        totalMatches: totalMatches || 0,
        activeSubscriptions,
        freePhase,
        pausedUsers,
      });
    }
  };

  const fetchUserPaymentHistory = async (paqueraProfileId: string) => {
    const { data } = await supabase
      .from('paquera_payments')
      .select('*')
      .eq('paquera_profile_id', paqueraProfileId)
      .order('created_at', { ascending: true });
    
    setUserPaymentHistory(data || []);
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

  const handleManualRelease = async (profile: PaqueraProfile) => {
    setProcessing(true);
    try {
      const expiresAt = addDays(new Date(), 30);
      
      const { error } = await supabase
        .from('paquera_subscriptions')
        .upsert({
          id: profile.subscription?.id,
          paquera_profile_id: profile.id,
          user_id: profile.user_id,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user!.id,
          interactions_count: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'paquera_profile_id' });

      if (error) throw error;

      toast({
        title: 'Usuário liberado!',
        description: `Acesso liberado até ${format(expiresAt, 'dd/MM/yyyy', { locale: ptBR })}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao liberar',
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

  const openUserReport = async (profile: PaqueraProfile) => {
    setReportProfile(profile);
    await fetchUserPaymentHistory(profile.id);
    setShowReportDialog(true);
  };

  // Filter profiles by category
  const freePhaseProfiles = profiles.filter((p) => {
    const sub = p.subscription;
    return !sub || (sub.interactions_count < sub.interactions_limit && sub.status !== 'active');
  });

  const premiumProfiles = profiles.filter((p) => {
    const sub = p.subscription;
    return sub?.status === 'active' && sub.expires_at && new Date(sub.expires_at) > new Date();
  });

  const pausedProfiles = profiles.filter((p) => {
    const sub = p.subscription;
    if (!sub) return false;
    const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
    const reachedLimit = sub.interactions_count >= sub.interactions_limit && sub.status !== 'active';
    return isExpired || reachedLimit;
  });

  const pendingPaymentsList = payments.filter((p) => p.status === 'pending');

  const filterBySearch = (profileList: PaqueraProfile[]) => {
    if (!searchTerm) return profileList;
    return profileList.filter((p) =>
      p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Feminino';
      default: return 'Outro';
    }
  };

  const getStatusBadge = (subscription?: PaqueraProfile['subscription']) => {
    if (!subscription) return <Badge variant="outline">Novo</Badge>;
    
    const now = new Date();
    const isExpired = subscription.expires_at && new Date(subscription.expires_at) < now;
    
    if (subscription.status === 'active' && !isExpired) {
      return <Badge className="bg-green-500">Premium</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (subscription.interactions_count >= subscription.interactions_limit) {
      return <Badge variant="secondary">Limite Atingido</Badge>;
    }
    return <Badge variant="outline">Fase Livre</Badge>;
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = differenceInDays(new Date(expiresAt), new Date());
    return days > 0 ? days : 0;
  };

  const renderProfileTable = (profileList: PaqueraProfile[], showReleaseButton = false) => (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Foto</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Interações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Liberação</TableHead>
            <TableHead>Renovação</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profileList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum perfil encontrado
              </TableCell>
            </TableRow>
          ) : (
            profileList.map((profile) => (
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
                  <span className="font-mono">
                    {profile.subscription?.interactions_count || 0}/
                    {profile.subscription?.interactions_limit || 10}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(profile.subscription)}</TableCell>
                <TableCell>
                  {profile.subscription?.approved_at
                    ? format(new Date(profile.subscription.approved_at), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell>
                  {profile.subscription?.expires_at ? (
                    <div>
                      <span>{format(new Date(profile.subscription.expires_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {getDaysRemaining(profile.subscription.expires_at) !== null && (
                        <p className="text-xs text-muted-foreground">
                          ({getDaysRemaining(profile.subscription.expires_at)} dias)
                        </p>
                      )}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowProfileDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUserReport(profile)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    {showReleaseButton && (
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleManualRelease(profile)}
                        disabled={processing}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Liberar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

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
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalProfiles}</p>
                  <p className="text-sm text-muted-foreground">Total Perfis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Crown className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-sm text-muted-foreground">Premium</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Gift className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.freePhase}</p>
                  <p className="text-sm text-muted-foreground">Fase Livre</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Pause className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pausedUsers}</p>
                  <p className="text-sm text-muted-foreground">Pausados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <CreditCard className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, username ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="profiles">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="profiles" className="gap-2">
              <Users className="w-4 h-4" />
              Perfis ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamentos
              {pendingPaymentsList.length > 0 && (
                <Badge className="ml-1 bg-red-500">{pendingPaymentsList.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Validação Manual
            </TabsTrigger>
            <TabsTrigger value="free" className="gap-2">
              <Gift className="w-4 h-4" />
              Fase Livre ({freePhaseProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="premium" className="gap-2">
              <Crown className="w-4 h-4" />
              Premium ({premiumProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="paused" className="gap-2">
              <Pause className="w-4 h-4" />
              Pausados ({pausedProfiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Perfis Paquera</CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileTable(filterBySearch(profiles))}
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
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                              {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
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
                                {payment.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => handleApprovePayment(payment.id)}
                                    disabled={processing}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
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

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="w-5 h-5" />
                  Validação Manual - Liberar Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileTable(filterBySearch(profiles), true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="free">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Fase Livre - Ainda não fizeram 10 pares
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileTable(filterBySearch(freePhaseProfiles))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Premium - Usuários que pagaram
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileTable(filterBySearch(premiumProfiles))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paused">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pause className="w-5 h-5" />
                  Pausados - Limite atingido ou expirados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileTable(filterBySearch(pausedProfiles), true)}
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

      {/* User Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Relatório Completo do Usuário
            </DialogTitle>
          </DialogHeader>

          {reportProfile && (
            <div className="space-y-6">
              {/* User Info Header */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={reportProfile.photo_url} />
                  <AvatarFallback className="text-xl">
                    {reportProfile.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{reportProfile.profiles?.full_name}</h3>
                  <p className="text-muted-foreground">@{reportProfile.profiles?.username}</p>
                  {getStatusBadge(reportProfile.subscription)}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Linha do Tempo
                </h4>
                
                <div className="space-y-3">
                  {/* Account Created */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Cadastro no Paquera</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reportProfile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Free Phase End (if reached limit) */}
                  {reportProfile.subscription && reportProfile.subscription.interactions_count >= 10 && (
                    <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Fase Livre Encerrada</p>
                        <p className="text-sm text-muted-foreground">
                          Atingiu o limite de 10 interações gratuitas
                        </p>
                      </div>
                    </div>
                  )}

                  {/* First Subscription */}
                  {reportProfile.subscription?.approved_at && (
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Primeira Adesão Premium (+30 dias)</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reportProfile.subscription.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expiration */}
                  {reportProfile.subscription?.expires_at && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      new Date(reportProfile.subscription.expires_at) > new Date() 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        new Date(reportProfile.subscription.expires_at) > new Date()
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        <Clock className={`w-5 h-5 ${
                          new Date(reportProfile.subscription.expires_at) > new Date()
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(reportProfile.subscription.expires_at) > new Date()
                            ? 'Data de Renovação'
                            : 'Assinatura Expirada'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reportProfile.subscription.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Histórico de Pagamentos ({userPaymentHistory.length})
                </h4>
                
                {userPaymentHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum pagamento registrado
                  </p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {userPaymentHistory.map((payment, index) => (
                        <div key={payment.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.status === 'approved' ? 'bg-green-500/20' :
                            payment.status === 'rejected' ? 'bg-red-500/20' :
                            'bg-yellow-500/20'
                          }`}>
                            {payment.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : payment.status === 'rejected' ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {index === 0 ? 'Primeiro Pagamento' : `Renovação #${index}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  PIX: {payment.pix_identifier}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  R$ {payment.amount.toFixed(2).replace('.', ',')}
                                </p>
                                <Badge variant={
                                  payment.status === 'approved' ? 'default' :
                                  payment.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }>
                                  {payment.status === 'approved' ? 'Aprovado' :
                                   payment.status === 'rejected' ? 'Rejeitado' :
                                   'Pendente'}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {payment.rejection_reason && (
                              <p className="text-xs text-red-500 mt-1">
                                Motivo: {payment.rejection_reason}
                              </p>
                            )}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-xs"
                              onClick={() => window.open(payment.receipt_url, '_blank')}
                            >
                              Ver Comprovante
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {userPaymentHistory
                      .filter(p => p.status === 'approved')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {userPaymentHistory.filter(p => p.status === 'approved').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pagamentos Aprovados</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
