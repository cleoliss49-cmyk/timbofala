import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Users, 
  FileText, 
  Flag, 
  Pin, 
  LogOut,
  Search,
  Trash2,
  Eye,
  UserX,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  can_delete_posts: boolean;
  can_delete_users: boolean;
  can_manage_admins: boolean;
  can_pin_posts: boolean;
  created_at: string;
}

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  resolved_at: string | null;
  action_taken: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  avatar_url: string | null;
  created_at: string;
  neighborhood: string;
  city: string;
}

interface PinnedPost {
  id: string;
  post_id: string;
  pin_location: string;
  duration_hours: number;
  impressions: number;
  starts_at: string;
  ends_at: string;
}

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    activeWeek: 0,
    activeMonth: 0,
    totalPosts: 0,
    pendingReports: 0,
  });
  
  // Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  
  // Search
  const [userSearch, setUserSearch] = useState('');
  const [idSearch, setIdSearch] = useState('');
  
  // Dialogs
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  
  // Pin form
  const [pinPostId, setPinPostId] = useState('');
  const [pinLocation, setPinLocation] = useState('feed');
  const [pinDuration, setPinDuration] = useState('24');
  
  // Add admin form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState({
    can_delete_posts: true,
    can_delete_users: false,
    can_manage_admins: false,
    can_pin_posts: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admtbo');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    try {
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

      setAdminData(data);
      await loadAllData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admtbo');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadReports(),
      loadPinnedPosts(),
      loadAdmins(),
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [usersRes, postsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact' }),
      supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    // Calculate active users (those who posted recently)
    const [todayPosts, weekPosts, monthPosts] = await Promise.all([
      supabase.from('posts').select('user_id').gte('created_at', today.toISOString()),
      supabase.from('posts').select('user_id').gte('created_at', weekAgo.toISOString()),
      supabase.from('posts').select('user_id').gte('created_at', monthAgo.toISOString()),
    ]);

    const uniqueToday = new Set(todayPosts.data?.map(p => p.user_id) || []).size;
    const uniqueWeek = new Set(weekPosts.data?.map(p => p.user_id) || []).size;
    const uniqueMonth = new Set(monthPosts.data?.map(p => p.user_id) || []).size;

    setStats({
      totalUsers: usersRes.count || 0,
      activeToday: uniqueToday,
      activeWeek: uniqueWeek,
      activeMonth: uniqueMonth,
      totalPosts: postsRes.count || 0,
      pendingReports: reportsRes.count || 0,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    setUsers(data || []);
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    setReports(data || []);
  };

  const loadPinnedPosts = async () => {
    const { data } = await supabase
      .from('pinned_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    setPinnedPosts(data || []);
  };

  const loadAdmins = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    setAdmins(data || []);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !adminData?.can_delete_users) return;

    try {
      // Delete user's posts first
      await supabase.from('posts').delete().eq('user_id', selectedUser.id);
      
      // Delete profile
      await supabase.from('profiles').delete().eq('id', selectedUser.id);

      toast({ title: 'Usuário excluído com sucesso' });
      setShowDeleteUserDialog(false);
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!adminData?.can_delete_posts) return;

    try {
      // Get post owner to notify
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post) {
        // Create notification for user
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'admin_action',
          title: 'Publicação removida',
          message: 'Sua publicação foi excluída por violar nossos termos de uso.',
        });
      }

      // Delete the post
      await supabase.from('posts').delete().eq('id', postId);

      toast({ title: 'Publicação excluída e usuário notificado' });
      loadStats();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleResolveReport = async (reportId: string, action: string) => {
    try {
      await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user!.id,
          action_taken: action,
        })
        .eq('id', reportId);

      toast({ title: 'Denúncia resolvida' });
      loadReports();
      loadStats();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handlePinPost = async () => {
    if (!pinPostId || !adminData?.can_pin_posts) return;

    try {
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + parseInt(pinDuration));

      await supabase.from('pinned_posts').insert({
        post_id: pinPostId,
        pinned_by: user!.id,
        pin_location: pinLocation,
        duration_hours: parseInt(pinDuration),
        ends_at: endsAt.toISOString(),
      });

      toast({ title: 'Publicação fixada com sucesso!' });
      setShowPinDialog(false);
      setPinPostId('');
      loadPinnedPosts();
    } catch (error: any) {
      toast({ title: 'Erro ao fixar', description: error.message, variant: 'destructive' });
    }
  };

  const handleUnpin = async (pinnedId: string) => {
    try {
      await supabase.from('pinned_posts').delete().eq('id', pinnedId);
      toast({ title: 'Publicação desafixada' });
      loadPinnedPosts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !adminData?.can_manage_admins) return;

    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            username: 'moderador',
            full_name: 'Moderador',
            neighborhood: 'Centro',
            city: 'Timbó',
            accepted_terms: true,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('admin_users').insert({
          user_id: data.user.id,
          email: newAdminEmail.toLowerCase(),
          role: 'moderator',
          ...newAdminPermissions,
          created_by: user!.id,
        });
      }

      toast({ title: 'Administrador adicionado com sucesso!' });
      setShowAddAdminDialog(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      loadAdmins();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!adminData?.can_manage_admins) return;

    try {
      await supabase.from('admin_users').delete().eq('id', adminId);
      toast({ title: 'Administrador removido' });
      loadAdmins();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleSearchById = async () => {
    if (!idSearch) return;

    // Try to find in posts
    const { data: post } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*)')
      .eq('id', idSearch)
      .maybeSingle();

    if (post) {
      toast({
        title: 'Post encontrado',
        description: `Por: ${(post.profiles as any)?.full_name || 'Desconhecido'}`,
      });
      return;
    }

    // Try to find in comments
    const { data: comment } = await supabase
      .from('comments')
      .select('*, profiles!comments_user_id_fkey(*)')
      .eq('id', idSearch)
      .maybeSingle();

    if (comment) {
      toast({
        title: 'Comentário encontrado',
        description: `Por: ${(comment.profiles as any)?.full_name || 'Desconhecido'}`,
      });
      return;
    }

    toast({ title: 'ID não encontrado', variant: 'destructive' });
  };

  const handleDeleteById = async () => {
    if (!idSearch) return;

    // Try to delete from posts
    const { error: postError } = await supabase.from('posts').delete().eq('id', idSearch);
    if (!postError) {
      toast({ title: 'Post excluído com sucesso' });
      setIdSearch('');
      loadStats();
      return;
    }

    // Try to delete from comments
    const { error: commentError } = await supabase.from('comments').delete().eq('id', idSearch);
    if (!commentError) {
      toast({ title: 'Comentário excluído com sucesso' });
      setIdSearch('');
      return;
    }

    toast({ title: 'Não foi possível excluir. Verifique o ID.', variant: 'destructive' });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admtbo');
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">{adminData?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                  <p className="text-xs text-muted-foreground">Ativos hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeWeek}</p>
                  <p className="text-xs text-muted-foreground">Semana</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeMonth}</p>
                  <p className="text-xs text-muted-foreground">Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  <p className="text-xs text-muted-foreground">Publicações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Flag className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                  <p className="text-xs text-muted-foreground">Denúncias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas por ID</CardTitle>
            <CardDescription>Busque, fixe ou exclua qualquer conteúdo pelo ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Cole ou digite o ID..."
                value={idSearch}
                onChange={(e) => setIdSearch(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Button variant="outline" onClick={handleSearchById}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              {adminData?.can_pin_posts && (
                <Button variant="outline" onClick={() => { setPinPostId(idSearch); setShowPinDialog(true); }}>
                  <Pin className="w-4 h-4 mr-2" />
                  Fixar
                </Button>
              )}
              {adminData?.can_delete_posts && (
                <Button variant="destructive" onClick={handleDeleteById}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="reports">Denúncias</TabsTrigger>
            <TabsTrigger value="pinned">Fixados</TabsTrigger>
            {adminData?.can_manage_admins && (
              <TabsTrigger value="admins">Admins</TabsTrigger>
            )}
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {u.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{u.username} • {u.neighborhood}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/profile/${u.username}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {adminData?.can_delete_users && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => { setSelectedUser(u); setShowDeleteUserDialog(true); }}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Denúncias</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 bg-muted rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                              {report.status === 'pending' ? 'Pendente' : 'Resolvido'}
                            </Badge>
                            <p className="font-medium mt-2">{report.reason}</p>
                            {report.description && (
                              <p className="text-sm text-muted-foreground">{report.description}</p>
                            )}
                          </div>
                          {report.status === 'pending' && adminData?.can_delete_posts && (
                            <div className="flex gap-2">
                              {report.reported_post_id && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/post/${report.reported_post_id}`, '_blank')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      handleDeletePost(report.reported_post_id!);
                                      handleResolveReport(report.id, 'post_deleted');
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResolveReport(report.id, 'ignored')}
                              >
                                Ignorar
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ID: {report.id}
                        </p>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma denúncia encontrada
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pinned Tab */}
          <TabsContent value="pinned" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Publicações Fixadas</CardTitle>
                  {adminData?.can_pin_posts && (
                    <Button onClick={() => setShowPinDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Fixar Publicação
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pinnedPosts.map((pin) => (
                    <div key={pin.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Post ID: {pin.post_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Local: {pin.pin_location} • {pin.impressions} impressões
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Até: {new Date(pin.ends_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/post/${pin.post_id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUnpin(pin.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pinnedPosts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma publicação fixada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          {adminData?.can_manage_admins && (
            <TabsContent value="admins" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Administradores</CardTitle>
                    <Button onClick={() => setShowAddAdminDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Admin
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Moderador'}
                            </Badge>
                            {admin.can_delete_posts && <Badge variant="outline">Excluir Posts</Badge>}
                            {admin.can_delete_users && <Badge variant="outline">Excluir Usuários</Badge>}
                            {admin.can_pin_posts && <Badge variant="outline">Fixar</Badge>}
                          </div>
                        </div>
                        {admin.role !== 'super_admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveAdmin(admin.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
                <CardDescription>
                  Use as abas acima para gerenciar usuários, denúncias, publicações fixadas e administradores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Suas Permissões</h3>
                    <div className="space-y-1 text-sm">
                      <p>Excluir publicações: {adminData?.can_delete_posts ? '✅' : '❌'}</p>
                      <p>Excluir usuários: {adminData?.can_delete_users ? '✅' : '❌'}</p>
                      <p>Fixar publicações: {adminData?.can_pin_posts ? '✅' : '❌'}</p>
                      <p>Gerenciar admins: {adminData?.can_manage_admins ? '✅' : '❌'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Dicas</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Use o campo de ID para ações rápidas</li>
                      <li>• Revise denúncias pendentes regularmente</li>
                      <li>• Publicações excluídas notificam o autor</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pin Post Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fixar Publicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID da Publicação</Label>
              <Input
                value={pinPostId}
                onChange={(e) => setPinPostId(e.target.value)}
                placeholder="Cole o ID da publicação..."
              />
            </div>
            <div>
              <Label>Local</Label>
              <Select value={pinLocation} onValueChange={setPinLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="auction">Leilão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração</Label>
              <Select value={pinDuration} onValueChange={setPinDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePinPost}>Fixar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-3">
              <Label>Permissões</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Excluir publicações</span>
                <Switch
                  checked={newAdminPermissions.can_delete_posts}
                  onCheckedChange={(c) => setNewAdminPermissions(p => ({ ...p, can_delete_posts: c }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Excluir usuários</span>
                <Switch
                  checked={newAdminPermissions.can_delete_users}
                  onCheckedChange={(c) => setNewAdminPermissions(p => ({ ...p, can_delete_users: c }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fixar publicações</span>
                <Switch
                  checked={newAdminPermissions.can_pin_posts}
                  onCheckedChange={(c) => setNewAdminPermissions(p => ({ ...p, can_pin_posts: c }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
