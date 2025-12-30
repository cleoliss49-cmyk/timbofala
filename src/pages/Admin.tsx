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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { ContentSearch } from '@/components/admin/ContentSearch';
import { UserBanDialog } from '@/components/admin/UserBanDialog';
import { 
  Shield, Users, FileText, Flag, Pin, LogOut, Search, Trash2, Eye, UserX, 
  TrendingUp, Calendar, Clock, Plus, X, Ban, BarChart3, AlertTriangle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AdminUser {
  id: string; user_id: string; email: string; role: string;
  can_delete_posts: boolean; can_delete_users: boolean; can_manage_admins: boolean; can_pin_posts: boolean;
  created_at: string;
}

interface Report {
  id: string; reason: string; description: string | null; status: string; created_at: string;
  reporter_id: string; reported_user_id: string | null; reported_post_id: string | null;
}

interface UserProfile {
  id: string; username: string; full_name: string; avatar_url: string | null;
  created_at: string; neighborhood: string; city: string;
}

interface PinnedPost {
  id: string; post_id: string; pin_location: string; duration_hours: number;
  impressions: number; starts_at: string; ends_at: string;
}

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, activeWeek: 0, activeMonth: 0, totalPosts: 0, pendingReports: 0 });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Dialogs
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [pinPostId, setPinPostId] = useState('');
  const [pinLocation, setPinLocation] = useState('feed');
  const [pinDuration, setPinDuration] = useState('24');

  useEffect(() => { if (!authLoading && !user) navigate('/admtbo'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) checkAdminAccess(); }, [user]);

  const checkAdminAccess = async () => {
    const { data, error } = await supabase.from('admin_users').select('*').eq('user_id', user!.id).maybeSingle();
    if (error || !data) { toast({ title: 'Acesso negado', variant: 'destructive' }); await signOut(); navigate('/admtbo'); return; }
    setAdminData(data);
    await loadAllData();
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadReports(), loadPinnedPosts(), loadAdmins()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [usersRes, postsRes, reportsRes, todayPosts, weekPosts, monthPosts] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact' }),
      supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('posts').select('user_id').gte('created_at', today.toISOString()),
      supabase.from('posts').select('user_id').gte('created_at', weekAgo.toISOString()),
      supabase.from('posts').select('user_id').gte('created_at', monthAgo.toISOString()),
    ]);
    setStats({
      totalUsers: usersRes.count || 0, totalPosts: postsRes.count || 0, pendingReports: reportsRes.count || 0,
      activeToday: new Set(todayPosts.data?.map(p => p.user_id) || []).size,
      activeWeek: new Set(weekPosts.data?.map(p => p.user_id) || []).size,
      activeMonth: new Set(monthPosts.data?.map(p => p.user_id) || []).size,
    });
  };

  const loadUsers = async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100); setUsers(data || []); };
  const loadReports = async () => { const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }); setReports(data || []); };
  const loadPinnedPosts = async () => { const { data } = await supabase.from('pinned_posts').select('*').order('created_at', { ascending: false }); setPinnedPosts(data || []); };
  const loadAdmins = async () => { const { data } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false }); setAdmins(data || []); };

  const handleDeleteUser = async () => {
    if (!selectedUser || !adminData?.can_delete_users) return;
    try {
      await supabase.from('posts').delete().eq('user_id', selectedUser.id);
      await supabase.from('profiles').delete().eq('id', selectedUser.id);
      toast({ title: 'Usuário excluído permanentemente' });
      setShowDeleteUserDialog(false); setSelectedUser(null); loadUsers(); loadStats();
    } catch (error: any) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
  };

  const handleResolveReport = async (reportId: string, action: string) => {
    await supabase.from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user!.id, action_taken: action }).eq('id', reportId);
    toast({ title: 'Denúncia resolvida' }); loadReports(); loadStats();
  };

  const handlePinPost = async () => {
    if (!pinPostId || !adminData?.can_pin_posts) return;
    const endsAt = new Date(); endsAt.setHours(endsAt.getHours() + parseInt(pinDuration));
    await supabase.from('pinned_posts').insert({ post_id: pinPostId, pinned_by: user!.id, pin_location: pinLocation, duration_hours: parseInt(pinDuration), ends_at: endsAt.toISOString() });
    toast({ title: 'Publicação fixada!' }); setShowPinDialog(false); setPinPostId(''); loadPinnedPosts();
  };

  const handleUnpin = async (pinnedId: string) => { await supabase.from('pinned_posts').delete().eq('id', pinnedId); toast({ title: 'Desafixado' }); loadPinnedPosts(); };
  const handleLogout = async () => { await signOut(); navigate('/admtbo'); };
  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase()));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">{adminData?.email} • {adminData?.role === 'super_admin' ? 'Super Admin' : 'Moderador'}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Users, value: stats.totalUsers, label: 'Usuários', color: 'text-primary' },
            { icon: Clock, value: stats.activeToday, label: 'Ativos hoje', color: 'text-green-500' },
            { icon: Calendar, value: stats.activeWeek, label: 'Semana', color: 'text-blue-500' },
            { icon: TrendingUp, value: stats.activeMonth, label: 'Mês', color: 'text-purple-500' },
            { icon: FileText, value: stats.totalPosts, label: 'Publicações', color: 'text-orange-500' },
            { icon: Flag, value: stats.pendingReports, label: 'Denúncias', color: 'text-red-500' },
          ].map((stat, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                  <div><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ContentSearch canDeletePosts={adminData?.can_delete_posts || false} canDeleteUsers={adminData?.can_delete_users || false} onAction={loadAllData} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="reports">Denúncias</TabsTrigger>
            <TabsTrigger value="pinned">Fixados</TabsTrigger>
            {adminData?.can_manage_admins && <TabsTrigger value="admins">Admins</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard">
            <Card><CardHeader><CardTitle>Bem-vindo</CardTitle><CardDescription>Use as abas para gerenciar a plataforma.</CardDescription></CardHeader></Card>
          </TabsContent>

          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Usuários</CardTitle>
                  <Input placeholder="Buscar..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="gradient-primary text-primary-foreground">{u.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">@{u.username} • {u.neighborhood}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/profile/${u.username}`, '_blank')}><Eye className="w-4 h-4" /></Button>
                          {adminData?.can_delete_users && (
                            <>
                              <Button variant="ghost" size="sm" className="text-orange-500" onClick={() => { setSelectedUser(u); setShowBanDialog(true); }}><Ban className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedUser(u); setShowDeleteUserDialog(true); }}><UserX className="w-4 h-4" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>Denúncias</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>{report.status === 'pending' ? 'Pendente' : 'Resolvido'}</Badge>
                            <p className="font-medium mt-2">{report.reason}</p>
                            {report.description && <p className="text-sm text-muted-foreground">{report.description}</p>}
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              {report.reported_post_id && <Button size="sm" variant="outline" onClick={() => window.open(`/post/${report.reported_post_id}`, '_blank')}><Eye className="w-4 h-4" /></Button>}
                              <Button size="sm" variant="secondary" onClick={() => handleResolveReport(report.id, 'ignored')}>Ignorar</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma denúncia</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pinned">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Publicações Fixadas</CardTitle>
                  {adminData?.can_pin_posts && <Button onClick={() => setShowPinDialog(true)}><Plus className="w-4 h-4 mr-2" />Fixar</Button>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pinnedPosts.map((pin) => (
                    <div key={pin.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-mono text-sm">Post: {pin.post_id}</p>
                        <p className="text-sm text-muted-foreground">Local: {pin.pin_location} • {pin.impressions} impressões</p>
                        <p className="text-xs text-muted-foreground">Até: {new Date(pin.ends_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/post/${pin.post_id}`, '_blank')}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUnpin(pin.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {pinnedPosts.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma publicação fixada</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {adminData?.can_manage_admins && (
            <TabsContent value="admins">
              <Card>
                <CardHeader><CardTitle>Administradores</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>{admin.role === 'super_admin' ? 'Super Admin' : 'Moderador'}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Excluir Usuário Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. Todos os dados de <strong>{selectedUser?.full_name}</strong> serão excluídos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Excluir Permanentemente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fixar Publicação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ID da Publicação</Label><Input value={pinPostId} onChange={(e) => setPinPostId(e.target.value)} placeholder="Cole o ID..." /></div>
            <div><Label>Local</Label>
              <Select value={pinLocation} onValueChange={setPinLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="auction">Leilão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Duração (horas)</Label><Input type="number" value={pinDuration} onChange={(e) => setPinDuration(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handlePinPost}>Fixar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <UserBanDialog open={showBanDialog} onOpenChange={setShowBanDialog} userId={selectedUser.id} userName={selectedUser.full_name} onSuccess={loadUsers} />
      )}
    </div>
  );
}
