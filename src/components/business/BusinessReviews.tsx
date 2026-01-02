import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface BusinessReviewsProps {
  businessId: string;
  businessOwnerId: string;
}

export function BusinessReviews({ businessId, businessOwnerId }: BusinessReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [businessId]);

  useEffect(() => {
    if (user) {
      checkExistingReview();
    }
  }, [user, businessId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data: reviewsData, error } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};

        const reviewsWithUsers = reviewsData?.map(r => ({
          ...r,
          user: profileMap[r.user_id] || { full_name: 'Usuário', username: '', avatar_url: null }
        })) || [];

        setReviews(reviewsWithUsers);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('business_reviews')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setExistingReview(data as any);
      setUserRating(data.rating);
      setUserComment(data.comment || '');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para avaliar',
        variant: 'destructive'
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: 'Selecione uma avaliação',
        description: 'Por favor, selecione de 1 a 5 estrelas',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from('business_reviews')
          .update({
            rating: userRating,
            comment: userComment || null
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast({ title: 'Avaliação atualizada!' });
      } else {
        const { error } = await supabase
          .from('business_reviews')
          .insert({
            business_id: businessId,
            user_id: user.id,
            rating: userRating,
            comment: userComment || null
          });

        if (error) throw error;
        toast({ title: 'Avaliação enviada!' });
      }

      await fetchReviews();
      await checkExistingReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a avaliação',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Avaliações
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= averageRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Write Review */}
      {user && businessOwnerId !== user.id && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium">
              {existingReview ? 'Editar sua avaliação' : 'Deixe sua avaliação'}
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || userRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Escreva um comentário (opcional)..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSubmitReview} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Enviando...' : existingReview ? 'Atualizar' : 'Enviar avaliação'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhuma avaliação ainda</p>
          <p className="text-sm">Seja o primeiro a avaliar esta empresa!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={review.user.avatar_url || ''} />
                    <AvatarFallback>{review.user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{review.user.full_name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
