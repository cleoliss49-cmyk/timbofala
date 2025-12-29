import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, MapPin, Users, Clock, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  event_date: string;
  end_date: string | null;
  image_url: string | null;
  category: string;
  is_free: boolean;
  price: number | null;
  max_attendees: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  attendees_count: number;
  is_attending: boolean;
}

const CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'musica', label: 'Música' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'educacao', label: 'Educação' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'religioso', label: 'Religioso' },
];

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    end_date: '',
    category: 'geral',
    is_free: true,
    price: '',
    max_attendees: '',
  });

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Get attendees count and user attendance for each event
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          const { count } = await supabase
            .from('event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          let isAttending = false;
          if (user) {
            const { data: attendance } = await supabase
              .from('event_attendees')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isAttending = !!attendance;
          }

          return {
            ...event,
            attendees_count: count || 0,
            is_attending: isAttending,
          };
        })
      );

      setEvents(eventsWithDetails);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        location: formData.location,
        event_date: formData.event_date,
        end_date: formData.end_date || null,
        image_url: imageUrl,
        category: formData.category,
        is_free: formData.is_free,
        price: formData.is_free ? null : parseFloat(formData.price) || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
      });

      if (error) throw error;

      toast({ title: 'Evento criado com sucesso!' });
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        event_date: '',
        end_date: '',
        category: 'geral',
        is_free: true,
        price: '',
        max_attendees: '',
      });
      setSelectedImage(null);
      setImagePreview(null);
      fetchEvents();
    } catch (error: any) {
      toast({ title: 'Erro ao criar evento', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttend = async (eventId: string, isAttending: boolean) => {
    if (!user) {
      toast({ title: 'Faça login para participar', variant: 'destructive' });
      return;
    }

    try {
      if (isAttending) {
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('event_attendees').insert({
          event_id: eventId,
          user_id: user.id,
        });
      }
      fetchEvents();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center shadow-soft">
                <Calendar className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Eventos</h1>
                <p className="text-muted-foreground text-sm">Descubra o que acontece em Timbó</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Título do evento *"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Descrição"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Local *"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Data/Hora Início *</label>
                      <Input
                        type="datetime-local"
                        value={formData.event_date}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Data/Hora Fim</label>
                      <Input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_free}
                        onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Evento gratuito</span>
                    </label>
                    {!formData.is_free && (
                      <Input
                        type="number"
                        placeholder="Preço (R$)"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-32"
                        step="0.01"
                      />
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Máximo de participantes (opcional)"
                      value={formData.max_attendees}
                      onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">
                      <div className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Adicionar imagem</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gradient-primary text-white">
                    {submitting ? 'Criando...' : 'Criar Evento'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-card p-12 text-center border border-border">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-display font-bold mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Seja o primeiro a criar um evento na comunidade!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {CATEGORIES.find(c => c.value === event.category)?.label || event.category}
                      </span>
                      <h3 className="text-xl font-display font-bold mt-2">{event.title}</h3>
                    </div>
                    {!event.is_free && event.price && (
                      <span className="text-lg font-bold text-primary">
                        R$ {event.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-muted-foreground mb-4">{event.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(event.event_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.attendees_count} confirmado{event.attendees_count !== 1 ? 's' : ''}
                        {event.max_attendees && ` / ${event.max_attendees} vagas`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Link to={`/profile/${event.profiles.username}`} className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={event.profiles.avatar_url || undefined} />
                        <AvatarFallback className="gradient-primary text-white text-xs">
                          {event.profiles.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{event.profiles.full_name}</span>
                    </Link>
                    <Button
                      variant={event.is_attending ? 'outline' : 'default'}
                      onClick={() => handleAttend(event.id, event.is_attending)}
                      className={!event.is_attending ? 'gradient-primary text-white' : ''}
                    >
                      {event.is_attending ? 'Cancelar' : 'Participar'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
