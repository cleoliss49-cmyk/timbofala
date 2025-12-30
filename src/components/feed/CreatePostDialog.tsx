import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, X, Loader2, BarChart3, Gavel, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [postType, setPostType] = useState<'text' | 'poll' | 'auction'>('text');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24');

  // Auction state
  const [auctionTitle, setAuctionTitle] = useState('');
  const [auctionDescription, setAuctionDescription] = useState('');
  const [auctionMinBid, setAuctionMinBid] = useState('');
  const [auctionIncrement, setAuctionIncrement] = useState('5');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const resetForm = () => {
    setContent('');
    setSelectedImage(null);
    setImagePreview(null);
    setPostType('text');
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration('24');
    setAuctionTitle('');
    setAuctionDescription('');
    setAuctionMinBid('');
    setAuctionIncrement('5');
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate based on post type
    if (postType === 'text' && !content.trim() && !selectedImage) return;
    if (postType === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
      toast({ title: 'Preencha a pergunta e pelo menos 2 opções', variant: 'destructive' });
      return;
    }
    if (postType === 'auction' && (!auctionTitle.trim() || !auctionMinBid)) {
      toast({ title: 'Preencha o título e lance mínimo', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create post
      const postContent = postType === 'poll' 
        ? `📊 ${pollQuestion}` 
        : postType === 'auction' 
          ? `🔨 ${auctionTitle}` 
          : content.trim() || null;

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postContent,
          image_url: imageUrl,
        })
        .select('id')
        .single();

      if (postError) throw postError;

      // Create poll if applicable
      if (postType === 'poll') {
        const endsAt = new Date();
        endsAt.setHours(endsAt.getHours() + parseInt(pollDuration));

        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: postData.id,
            question: pollQuestion,
            ends_at: endsAt.toISOString(),
          })
          .select('id')
          .single();

        if (pollError) throw pollError;

        // Create poll options
        const validOptions = pollOptions.filter(o => o.trim());
        for (const optionText of validOptions) {
          await supabase.from('poll_options').insert({
            poll_id: pollData.id,
            option_text: optionText,
          });
        }
      }

      // Create auction if applicable
      if (postType === 'auction') {
        const { error: auctionError } = await supabase.from('auctions').insert({
          post_id: postData.id,
          title: auctionTitle,
          description: auctionDescription || null,
          image_url: imageUrl,
          min_bid: parseFloat(auctionMinBid),
          bid_increment_percent: parseInt(auctionIncrement),
        });

        if (auctionError) throw auctionError;
      }

      toast({ title: 'Publicado com sucesso!' });
      resetForm();
      onOpenChange(false);
      onPostCreated?.();
    } catch (error: any) {
      toast({ title: 'Erro ao publicar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (postType === 'text') return content.trim() || selectedImage;
    if (postType === 'poll') return pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;
    if (postType === 'auction') return auctionTitle.trim() && auctionMinBid;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Criar Publicação</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="gradient-primary text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">@{profile?.username}</p>
              </div>
            </div>

            <Tabs value={postType} onValueChange={(v) => setPostType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="poll">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Enquete
                </TabsTrigger>
                <TabsTrigger value="auction">
                  <Gavel className="w-4 h-4 mr-1" />
                  Leilão
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que está acontecendo em Timbó?"
                  className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base p-0"
                />
              </TabsContent>

              <TabsContent value="poll" className="space-y-4 mt-4">
                <div>
                  <Label>Pergunta da enquete</Label>
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Faça uma pergunta..."
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opções</Label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePollOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPollOption}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar opção
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Duração</Label>
                  <Select value={pollDuration} onValueChange={setPollDuration}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">1 dia</SelectItem>
                      <SelectItem value="72">3 dias</SelectItem>
                      <SelectItem value="168">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="auction" className="space-y-4 mt-4">
                <div>
                  <Label>Título do produto</Label>
                  <Input
                    value={auctionTitle}
                    onChange={(e) => setAuctionTitle(e.target.value)}
                    placeholder="Ex: iPhone 14 Pro Max"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={auctionDescription}
                    onChange={(e) => setAuctionDescription(e.target.value)}
                    placeholder="Descreva o produto..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lance mínimo (R$)</Label>
                    <Input
                      type="number"
                      value={auctionMinBid}
                      onChange={(e) => setAuctionMinBid(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Incremento por lance</Label>
                    <Select value={auctionIncrement} onValueChange={setAuctionIncrement}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <label className="cursor-pointer">
                <div className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit()}
                className="gradient-primary text-white px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
