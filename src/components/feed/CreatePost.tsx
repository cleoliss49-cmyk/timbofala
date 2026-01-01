import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Image, X, Loader2, Smile, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface CreatePostProps {
  onPostCreated: () => void;
}

const FEELINGS = [
  { emoji: '😊', label: 'feliz' },
  { emoji: '😢', label: 'triste' },
  { emoji: '😡', label: 'irritado' },
  { emoji: '😍', label: 'apaixonado' },
  { emoji: '🤔', label: 'pensativo' },
  { emoji: '😴', label: 'cansado' },
  { emoji: '🎉', label: 'comemorando' },
  { emoji: '😎', label: 'confiante' },
  { emoji: '🥳', label: 'festejando' },
  { emoji: '😋', label: 'com fome' },
  { emoji: '🙏', label: 'grato' },
  { emoji: '💪', label: 'motivado' },
];

interface UserSuggestion {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feeling, setFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const query = textBeforeCursor.substring(atIndex + 1);
      if (!query.includes(' ') && query.length >= 0) {
        setShowMentions(true);
        setMentionQuery(query);
        setMentionPosition(atIndex);

        // Search users
        if (query.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(5);
          setUserSuggestions(data || []);
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .limit(5);
          setUserSuggestions(data || []);
        }
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (username: string) => {
    const beforeMention = content.substring(0, mentionPosition);
    const afterMention = content.substring(mentionPosition + mentionQuery.length + 1);
    setContent(`${beforeMention}@${username} ${afterMention}`);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !image)) return;

    setLoading(true);

    try {
      let imageUrl = null;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data: post, error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim() || null,
        image_url: imageUrl,
        feeling: feeling ? `${feeling.emoji} ${feeling.label}` : null,
      }).select().single();

      if (error) throw error;

      // Handle mentions
      const mentions = extractMentions(content);
      if (mentions.length > 0) {
        // Get user IDs for mentioned usernames
        const { data: mentionedUsers } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentions);

        if (mentionedUsers && mentionedUsers.length > 0) {
          // Create mention records
          const mentionRecords = mentionedUsers.map(u => ({
            post_id: post.id,
            mentioned_user_id: u.id,
          }));
          await supabase.from('mentions').insert(mentionRecords);
        }
      }

      setContent('');
      setImage(null);
      setImagePreview(null);
      setFeeling(null);
      onPostCreated();

      toast({
        title: 'Publicado!',
        description: 'Sua publicação foi compartilhada.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível publicar. Tente novamente.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  // Render content with clickable mentions
  const renderContentPreview = () => {
    if (!content) return null;
    
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-4 md:p-6 mb-6 border border-border">
      <div className="flex gap-3 md:gap-4">
        <Avatar className="w-10 h-10 md:w-12 md:h-12 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="gradient-primary text-primary-foreground">
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          {feeling && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sentindo-se {feeling.emoji} {feeling.label}</span>
              <button onClick={() => setFeeling(null)} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="O que está acontecendo em Timbó?"
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base"
            />

            {showMentions && userSuggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 w-64 max-h-48 overflow-y-auto">
                {userSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => insertMention(suggestion.username)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={suggestion.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-white text-xs">
                        {suggestion.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{suggestion.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{suggestion.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-xl object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-foreground/80 text-background rounded-full hover:bg-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Adicionar foto"
              >
                <Image className="w-5 h-5 text-primary" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Adicionar sentimento"
                  >
                    <Smile className="w-5 h-5 text-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <p className="text-sm font-medium mb-2">Como você está se sentindo?</p>
                  <div className="grid grid-cols-4 gap-1">
                    {FEELINGS.map((f) => (
                      <button
                        key={f.label}
                        onClick={() => {
                          setFeeling(f);
                        }}
                        className={`p-2 rounded-lg hover:bg-muted transition-colors text-center ${
                          feeling?.label === f.label ? 'bg-primary/10' : ''
                        }`}
                        title={f.label}
                      >
                        <span className="text-xl">{f.emoji}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const cursorPos = textareaRef.current?.selectionStart || content.length;
                  const newContent = content.slice(0, cursorPos) + '@' + content.slice(cursorPos);
                  setContent(newContent);
                  setMentionPosition(cursorPos);
                  setMentionQuery('');
                  setShowMentions(true);
                  
                  // Fetch initial suggestions
                  supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .limit(5)
                    .then(({ data }) => setUserSuggestions(data || []));
                  
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
                title="Marcar amigo"
              >
                <AtSign className="w-5 h-5 text-primary" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !image)}
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Publicar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}