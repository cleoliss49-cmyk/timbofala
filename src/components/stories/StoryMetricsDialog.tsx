import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileDown, Eye, Users, Clock, TrendingUp, 
  UserCheck, MapPin, Video, Image, Trash2 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Story {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  title: string | null;
  target_audience: string;
  duration_hours: number;
  expires_at: string;
  created_at: string;
}

interface StoryView {
  id: string;
  user_id: string;
  viewed_at: string;
  user_gender: string | null;
  user_city: string | null;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface StoryMetrics {
  totalViews: number;
  uniqueViewers: number;
  maleViewers: number;
  femaleViewers: number;
  otherViewers: number;
  viewsByCity: { city: string; count: number }[];
  viewsByHour: { hour: number; count: number }[];
  viewers: StoryView[];
}

interface StoryMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stories: Story[];
  onDeleteStory: (storyId: string) => void;
}

export function StoryMetricsDialog({ open, onOpenChange, stories, onDeleteStory }: StoryMetricsDialogProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [metrics, setMetrics] = useState<StoryMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stories.length > 0 && !selectedStory) {
      setSelectedStory(stories[0]);
    }
  }, [stories]);

  useEffect(() => {
    if (!selectedStory) return;
    fetchMetrics(selectedStory.id);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`metrics-${selectedStory.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'story_views',
        filter: `story_id=eq.${selectedStory.id}`,
      }, () => {
        fetchMetrics(selectedStory.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStory]);

  const fetchMetrics = async (storyId: string) => {
    setLoading(true);
    try {
      const { data: viewsRaw, error } = await supabase
        .from('story_views')
        .select('*')
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each view
      const viewsData: StoryView[] = [];
      for (const view of viewsRaw || []) {
        const viewAny = view as any;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', view.user_id)
          .single();
        
        viewsData.push({
          id: view.id,
          user_id: view.user_id,
          viewed_at: view.viewed_at,
          user_gender: viewAny.user_gender || null,
          user_city: viewAny.user_city || null,
          profiles: profileData || undefined,
        });
      }
      
      // Calculate metrics
      const maleViewers = viewsData.filter(v => v.user_gender === 'male').length;
      const femaleViewers = viewsData.filter(v => v.user_gender === 'female').length;
      const otherViewers = viewsData.length - maleViewers - femaleViewers;

      // Group by city
      const cityMap: Record<string, number> = {};
      viewsData.forEach(v => {
        const city = v.user_city || 'Desconhecido';
        cityMap[city] = (cityMap[city] || 0) + 1;
      });
      const viewsByCity = Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);

      // Group by hour
      const hourMap: Record<number, number> = {};
      viewsData.forEach(v => {
        const hour = new Date(v.viewed_at).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      });
      const viewsByHour = Object.entries(hourMap)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);

      setMetrics({
        totalViews: viewsData.length,
        uniqueViewers: viewsData.length,
        maleViewers,
        femaleViewers,
        otherViewers,
        viewsByCity,
        viewsByHour,
        viewers: viewsData,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!selectedStory || !metrics) return;

    // Create PDF content
    const content = `
RELATÓRIO DE MÉTRICAS - STORY
=============================

Título: ${selectedStory.title || 'Sem título'}
Data de criação: ${format(new Date(selectedStory.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
Expira em: ${format(new Date(selectedStory.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
Público-alvo: ${getAudienceLabel(selectedStory.target_audience)}
Duração: ${selectedStory.duration_hours} horas

MÉTRICAS GERAIS
---------------
Total de visualizações: ${metrics.totalViews}
Visualizadores únicos: ${metrics.uniqueViewers}

DIVISÃO POR GÊNERO
------------------
Homens: ${metrics.maleViewers} (${((metrics.maleViewers / metrics.totalViews) * 100 || 0).toFixed(1)}%)
Mulheres: ${metrics.femaleViewers} (${((metrics.femaleViewers / metrics.totalViews) * 100 || 0).toFixed(1)}%)
Outros/Não informado: ${metrics.otherViewers} (${((metrics.otherViewers / metrics.totalViews) * 100 || 0).toFixed(1)}%)

VISUALIZAÇÕES POR CIDADE
------------------------
${metrics.viewsByCity.map(c => `${c.city}: ${c.count} visualizações`).join('\n')}

LISTA DE VISUALIZADORES
-----------------------
${metrics.viewers.map(v => `- @${v.profiles?.username || 'anônimo'} (${v.profiles?.full_name || 'N/A'}) - ${format(new Date(v.viewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`).join('\n')}

=============================
Relatório gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
    `;

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-metrics-${selectedStory.id.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'women': return 'Apenas mulheres';
      case 'men': return 'Apenas homens';
      default: return 'Todos os usuários';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Métricas de Stories
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stories list */}
          <div className="md:col-span-1 border rounded-lg p-3">
            <h3 className="font-semibold mb-3 text-sm">Seus Stories</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {stories.map(story => (
                  <div
                    key={story.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStory?.id === story.id 
                        ? 'bg-primary/10 border border-primary' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSelectedStory(story)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {story.media_type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <img 
                            src={story.media_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {story.title || 'Sem título'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getAudienceLabel(story.target_audience)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Metrics panel */}
          <div className="md:col-span-2 border rounded-lg p-4">
            {selectedStory && metrics ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedStory.title || 'Story sem título'}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportPDF}>
                      <FileDown className="w-4 h-4 mr-1" />
                      Exportar PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este story?')) {
                          onDeleteStory(selectedStory.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{metrics.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Visualizações</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{metrics.maleViewers}</p>
                    <p className="text-xs text-muted-foreground">Homens</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-pink-500" />
                    <p className="text-2xl font-bold">{metrics.femaleViewers}</p>
                    <p className="text-xs text-muted-foreground">Mulheres</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-2xl font-bold">{selectedStory.duration_hours}h</p>
                    <p className="text-xs text-muted-foreground">Duração</p>
                  </div>
                </div>

                <Tabs defaultValue="viewers">
                  <TabsList className="w-full">
                    <TabsTrigger value="viewers" className="flex-1">Visualizadores</TabsTrigger>
                    <TabsTrigger value="cities" className="flex-1">Por Cidade</TabsTrigger>
                  </TabsList>

                  <TabsContent value="viewers">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {metrics.viewers.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma visualização ainda
                          </p>
                        ) : (
                          metrics.viewers.map(viewer => (
                            <div key={viewer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <UserCheck className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  @{viewer.profiles?.username || 'anônimo'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(viewer.viewed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {viewer.user_gender === 'male' ? '♂' : viewer.user_gender === 'female' ? '♀' : '?'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="cities">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {metrics.viewsByCity.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma visualização ainda
                          </p>
                        ) : (
                          metrics.viewsByCity.map(({ city, count }) => (
                            <div key={city} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{city}</p>
                              </div>
                              <Badge>{count}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecione um story para ver as métricas
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
