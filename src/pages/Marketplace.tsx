import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Plus, MapPin, X, Image as ImageIcon, Heart, MessageCircle, Edit, Trash2, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  image_url: string | null;
  is_sold: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

const CATEGORIES = [
  { value: 'outros', label: 'Outros' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'veiculos', label: 'Veículos' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'moveis', label: 'Móveis' },
  { value: 'roupas', label: 'Roupas' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'servicos', label: 'Serviços' },
];

const CONDITIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'seminovo', label: 'Seminovo' },
  { value: 'usado', label: 'Usado' },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [commentDialogProduct, setCommentDialogProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'outros',
    condition: 'novo',
    location: '',
  });

  useEffect(() => {
    fetchProducts();
    if (user) fetchMyProducts();
  }, [filterCategory, user]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles!products_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get likes and comments counts
      const productsWithDetails = await Promise.all(
        (data || []).map(async (product) => {
          const { count: likesCount } = await supabase
            .from('product_likes')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id);

          const { count: commentsCount } = await supabase
            .from('product_comments')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id);

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('product_likes')
              .select('id')
              .eq('product_id', product.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          return {
            ...product,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: isLiked,
          };
        })
      );

      setProducts(productsWithDetails);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setMyProducts(data || []);
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'outros',
      condition: 'novo',
      location: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let imageUrl = editingProduct?.image_url || null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            title: formData.title,
            description: formData.description || null,
            price: parseFloat(formData.price),
            category: formData.category,
            condition: formData.condition,
            location: formData.location || null,
            image_url: imageUrl,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Anúncio atualizado!' });
      } else {
        const { error } = await supabase.from('products').insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          location: formData.location || null,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast({ title: 'Anúncio criado com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
      fetchMyProducts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      condition: product.condition,
      location: product.location || '',
    });
    setImagePreview(product.image_url);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteProductId);
      if (error) throw error;
      toast({ title: 'Anúncio excluído!' });
      fetchProducts();
      fetchMyProducts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
    setDeleteProductId(null);
  };

  const handleMarkSold = async (productId: string, isSold: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_sold: !isSold })
        .eq('id', productId);
      
      if (error) throw error;
      toast({ title: isSold ? 'Anúncio reativado!' : 'Marcado como vendido!' });
      fetchProducts();
      fetchMyProducts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleLike = async (productId: string, isLiked: boolean) => {
    if (!user) {
      toast({ title: 'Faça login para curtir', variant: 'destructive' });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('product_likes')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('product_likes').insert({
          product_id: productId,
          user_id: user.id,
        });
      }
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const openComments = async (product: Product) => {
    setCommentDialogProduct(product);
    const { data } = await supabase
      .from('product_comments')
      .select(`
        *,
        profiles!product_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('product_id', product.id)
      .order('created_at', { ascending: true });
    
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!user || !commentDialogProduct || !newComment.trim()) return;

    try {
      await supabase.from('product_comments').insert({
        product_id: commentDialogProduct.id,
        user_id: user.id,
        content: newComment.trim(),
      });
      setNewComment('');
      openComments(commentDialogProduct);
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleContact = (product: Product) => {
    // Navigate to messages with pre-filled message
    const message = encodeURIComponent(`Olá, meu contato é referente o produto "${product.title}"`);
    navigate(`/messages/${product.user_id}?message=${message}`);
  };

  const renderProductCard = (product: Product, isOwner: boolean = false) => (
    <div key={product.id} className={`bg-card rounded-2xl shadow-card border border-border overflow-hidden hover:shadow-lg transition-shadow ${product.is_sold ? 'opacity-60' : ''}`}>
      {product.image_url ? (
        <div className="relative">
          <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover" />
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold">
                VENDIDO
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center relative">
          <Store className="w-12 h-12 text-muted-foreground/30" />
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold">
                VENDIDO
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {CATEGORIES.find(c => c.value === product.category)?.label || product.category}
            </span>
            <h3 className="font-bold mt-2 truncate">{product.title}</h3>
          </div>
        </div>
        
        <p className="text-2xl font-bold text-primary mb-3">
          R$ {product.price.toFixed(2)}
        </p>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="px-2 py-1 rounded bg-muted">
            {CONDITIONS.find(c => c.value === product.condition)?.label || product.condition}
          </span>
          {product.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {product.location}
            </span>
          )}
        </div>

        {isOwner ? (
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleEdit(product)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant={product.is_sold ? "default" : "secondary"}
              onClick={() => handleMarkSold(product.id, product.is_sold)}
            >
              <Package className="w-4 h-4 mr-1" />
              {product.is_sold ? 'Reativar' : 'Vendido'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteProductId(product.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-3">
              <button 
                onClick={() => handleLike(product.id, product.is_liked || false)}
                className={`flex items-center gap-1 text-sm ${product.is_liked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500 transition-colors`}
              >
                <Heart className={`w-4 h-4 ${product.is_liked ? 'fill-current' : ''}`} />
                {product.likes_count || 0}
              </button>
              <button 
                onClick={() => openComments(product)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {product.comments_count || 0}
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link to={`/profile/${product.profiles.username}`} className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={product.profiles.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-white text-xs">
                    {product.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate max-w-[80px]">{product.profiles.full_name}</span>
              </Link>
              <Button size="sm" variant="outline" className="h-8" onClick={() => handleContact(product)}>
                <MessageCircle className="w-4 h-4 mr-1" />
                Contato
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-premium rounded-xl flex items-center justify-center shadow-soft">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Marketplace</h1>
                <p className="text-muted-foreground text-sm">Compre e venda na sua comunidade</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="gradient-premium text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Anunciar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Editar Anúncio' : 'Criar Anúncio'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Título do anúncio *"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Descrição do produto"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Preço (R$) *"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Condição" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((cond) => (
                            <SelectItem key={cond.value} value={cond.value}>
                              {cond.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Localização (bairro)"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2">
                        <div className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Adicionar foto do produto</span>
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
                    <Button type="submit" disabled={submitting} className="w-full gradient-premium text-white">
                      {submitting ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Publicar Anúncio')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todos os Anúncios</TabsTrigger>
            <TabsTrigger value="my">Meus Anúncios</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse">
                    <div className="h-40 bg-muted rounded-lg mb-3" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-card rounded-2xl shadow-card p-12 text-center border border-border">
                <Store className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Seja o primeiro a anunciar na comunidade!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => renderProductCard(product, false))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my">
            {myProducts.length === 0 ? (
              <div className="bg-card rounded-2xl shadow-card p-12 text-center border border-border">
                <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Você não tem anúncios</h3>
                <p className="text-muted-foreground mb-6">
                  Crie seu primeiro anúncio e comece a vender!
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-premium text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Anúncio
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((product) => renderProductCard(product, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comments Dialog */}
      <Dialog open={!!commentDialogProduct} onOpenChange={() => setCommentDialogProduct(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comentários - {commentDialogProduct?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum comentário ainda</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="gradient-primary text-white text-xs">
                      {comment.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{comment.profiles?.full_name}</p>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}