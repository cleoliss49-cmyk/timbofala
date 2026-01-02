import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, Store, Truck, Star, ShoppingCart, 
  ArrowLeft, Send, MessageCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  category: string;
  stock_quantity: number | null;
  is_available: boolean;
  allows_delivery: boolean;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  offers_delivery: boolean;
}

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

export default function Product() {
  const { businessSlug, productId } = useParams<{ businessSlug: string; productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    if (businessSlug && productId) {
      fetchProductData();
    }
  }, [businessSlug, productId]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id, user_id, business_name, slug, logo_url, offers_delivery')
        .eq('slug', businessSlug)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!businessData) {
        navigate('/empresas');
        return;
      }

      setBusiness(businessData);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('business_products')
        .select('*')
        .eq('id', productId)
        .eq('business_id', businessData.id)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        navigate(`/empresa/${businessSlug}`);
        return;
      }

      setProduct(productData);

      // Fetch reviews
      await fetchReviews(productId);

      // Check if user has already reviewed
      if (user) {
        const { data: userReview } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userReview) {
          setExistingReview(userReview as any);
          setUserRating(userReview.rating);
          setUserComment(userReview.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o produto',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (prodId: string) => {
    const { data: reviewsData, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', prodId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }

    // Fetch user profiles for reviews
    const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
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
  };

  const handleSubmitReview = async () => {
    if (!user || !product) {
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

    setSubmittingReview(true);
    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('product_reviews')
          .update({
            rating: userRating,
            comment: userComment || null
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast({ title: 'Avaliação atualizada!' });
      } else {
        // Create new review
        const { error } = await supabase
          .from('product_reviews')
          .insert({
            product_id: product.id,
            user_id: user.id,
            rating: userRating,
            comment: userComment || null
          });

        if (error) throw error;
        toast({ title: 'Avaliação enviada!' });
      }

      await fetchReviews(product.id);
      
      // Refresh existing review
      const { data: updatedReview } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setExistingReview(updatedReview as any);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a avaliação',
        variant: 'destructive'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const getProductPrice = () => {
    if (!product) return 0;
    return product.promotional_price || product.price;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!product || !business) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Produto não encontrado</h2>
          <Button onClick={() => navigate('/empresas')}>Ver todas as lojas</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/empresa/${business.slug}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para {business.business_name}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.image_url ? (
              <img 
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
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
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1">
              {product.promotional_price ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-green-600">
                      R$ {product.promotional_price.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500">
                      {Math.round((1 - product.promotional_price / product.price) * 100)}% OFF
                    </Badge>
                  </div>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            {/* Delivery Badge */}
            {product.allows_delivery && business.offers_delivery && (
              <div className="flex items-center gap-2 text-green-600">
                <Truck className="w-5 h-5" />
                <span className="font-medium">Entrega disponível</span>
              </div>
            )}

            {/* Business Link */}
            <Card>
              <CardContent className="p-4">
                <Link to={`/empresa/${business.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.business_name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{business.business_name}</p>
                    <p className="text-sm text-muted-foreground">Ver todos os produtos</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Add to Cart Button */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => navigate(`/empresa/${business.slug}`)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Comprar na loja
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Avaliações
          </h2>

          {/* Write Review */}
          {user && business.user_id !== user.id && (
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
                <Button onClick={handleSubmitReview} disabled={submittingReview}>
                  <Send className="w-4 h-4 mr-2" />
                  {submittingReview ? 'Enviando...' : existingReview ? 'Atualizar' : 'Enviar avaliação'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma avaliação ainda</p>
                <p className="text-sm">Seja o primeiro a avaliar este produto!</p>
              </div>
            ) : (
              reviews.map((review) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
