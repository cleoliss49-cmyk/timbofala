import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Users, FileText, MessageCircle, Calendar } from 'lucide-react';

interface DailyStats {
  date: string;
  users: number;
  posts: number;
  comments: number;
}

interface CategoryStats {
  name: string;
  value: number;
}

const COLORS = ['hsl(16, 90%, 50%)', 'hsl(175, 60%, 40%)', 'hsl(45, 100%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(220, 70%, 50%)'];

export function AdminAnalytics() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [neighborhoodStats, setNeighborhoodStats] = useState<CategoryStats[]>([]);
  const [engagementStats, setEngagementStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    
    // Get last 30 days of data
    const days: DailyStats[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const [usersRes, postsRes, commentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', nextDate.toISOString().split('T')[0]),
        supabase.from('posts').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', nextDate.toISOString().split('T')[0]),
        supabase.from('comments').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', nextDate.toISOString().split('T')[0]),
      ]);
      
      days.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        users: usersRes.count || 0,
        posts: postsRes.count || 0,
        comments: commentsRes.count || 0,
      });
    }
    
    setDailyStats(days);

    // Neighborhood distribution
    const { data: profiles } = await supabase.from('profiles').select('neighborhood');
    const neighborhoodCounts: Record<string, number> = {};
    profiles?.forEach(p => {
      const n = p.neighborhood || 'Outro';
      neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
    });
    
    const sortedNeighborhoods = Object.entries(neighborhoodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    
    setNeighborhoodStats(sortedNeighborhoods);

    // Engagement stats
    const [reactionsRes, commentsTotal, savedRes] = await Promise.all([
      supabase.from('reactions').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('saved_posts').select('id', { count: 'exact', head: true }),
    ]);

    setEngagementStats([
      { name: 'Curtidas', value: reactionsRes.count || 0 },
      { name: 'Comentários', value: commentsTotal.count || 0 },
      { name: 'Salvos', value: savedRes.count || 0 },
    ]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-6 animate-pulse">
        <div className="h-80 bg-muted rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate totals for summary cards
  const totalNewUsers = dailyStats.reduce((sum, d) => sum + d.users, 0);
  const totalNewPosts = dailyStats.reduce((sum, d) => sum + d.posts, 0);
  const totalComments = dailyStats.reduce((sum, d) => sum + d.comments, 0);
  const avgDailyPosts = (totalNewPosts / 30).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNewUsers}</p>
                <p className="text-xs text-muted-foreground">Novos (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center">
                <FileText className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNewPosts}</p>
                <p className="text-xs text-muted-foreground">Publicações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalComments}</p>
                <p className="text-xs text-muted-foreground">Comentários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgDailyPosts}</p>
                <p className="text-xs text-muted-foreground">Posts/dia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Crescimento nos Últimos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(16, 90%, 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(16, 90%, 50%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(175, 60%, 40%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(175, 60%, 40%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      name="Novos Usuários"
                      stroke="hsl(16, 90%, 50%)" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="posts" 
                      name="Publicações"
                      stroke="hsl(175, 60%, 40%)" 
                      fillOpacity={1} 
                      fill="url(#colorPosts)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="posts" name="Posts" fill="hsl(16, 90%, 50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comments" name="Comentários" fill="hsl(175, 60%, 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {engagementStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Bairro (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={neighborhoodStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" name="Usuários" fill="hsl(16, 90%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
