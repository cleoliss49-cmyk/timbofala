import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, Plus, Edit, Trash2, Eye, ExternalLink, 
  Upload, Loader2, ShoppingBag, Clock, CheckCircle, 
  XCircle, Truck, Store, BarChart3
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  offers_delivery: boolean;
  is_verified: boolean;
}

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

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  wants_delivery: boolean;
  delivery_address: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  created_at: string;
  customer: {
    full_name: string;
    username: string;
  };
  items: {
    product_name: string;
    quantity: number;
    product_price: number;
  }[];
}

import { PRODUCT_CATEGORIES, getCategoryInfo } from '@/lib/productCategories';

const ORDER_STATUS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-500' },
  { value: 'preparing', label: 'Preparando', color: 'bg-orange-500' },
  { value: 'ready', label: 'Pronto', color: 'bg-green-500' },
  { value: 'delivered', label: 'Entregue', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' }
];

export default function BusinessManage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    promotional_price: '',
    category: 'Geral',
    stock_quantity: '',
    is_available: true,
    allows_delivery: true,
    accepts_pix: true,
    accepts_cash: true,
    accepts_debit: true,
    accepts_credit: true,
    prep_time_minutes: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchBusiness();
    }
  }, [user, authLoading]);

  const fetchBusiness = async () => {
    try {
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (businessError) throw businessError;

      if (!businessData) {
        navigate('/empresa/criar');
        return;
      }

      setBusiness(businessData);
      await Promise.all([
        fetchProducts(businessData.id),
        fetchOrders(businessData.id)
      ]);
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar sua empresa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (businessId: string) => {
    const { data, error } = await supabase
      .from('business_products')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    setProducts(data || []);
  };

  const fetchOrders = async (businessId: string) => {
    const { data: ordersData, error } = await supabase
      .from('business_orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    // Fetch customer info and items separately
    const ordersWithDetails = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: customer } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', order.customer_id)
          .single();

        const { data: items } = await supabase
          .from('business_order_items')
          .select('product_name, quantity, product_price')
          .eq('order_id', order.id);

        return {
          ...order,
          customer: customer || { full_name: 'Cliente', username: '' },
          items: items || []
        };
      })
    );

    setOrders(ordersWithDetails);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      promotional_price: '',
      category: 'Geral',
      stock_quantity: '',
      is_available: true,
      allows_delivery: true,
      accepts_pix: true,
      accepts_cash: true,
      accepts_debit: true,
      accepts_credit: true,
      prep_time_minutes: ''
    });
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      promotional_price: product.promotional_price?.toString() || '',
      category: product.category,
      stock_quantity: product.stock_quantity?.toString() || '',
      is_available: product.is_available,
      allows_delivery: product.allows_delivery,
      accepts_pix: (product as any).accepts_pix ?? true,
      accepts_cash: (product as any).accepts_cash ?? true,
      accepts_debit: (product as any).accepts_debit ?? true,
      accepts_credit: (product as any).accepts_credit ?? true,
      prep_time_minutes: (product as any).prep_time_minutes?.toString() || ''
    });
    setImagePreview(product.image_url || '');
    setShowProductDialog(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadProductImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/products/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('business')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('business')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e preço são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      let image_url = editingProduct?.image_url || null;
      
      if (imageFile) {
        image_url = await uploadProductImage(imageFile);
      }

      const productData = {
        business_id: business!.id,
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        promotional_price: productForm.promotional_price ? parseFloat(productForm.promotional_price) : null,
        category: productForm.category,
        stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : null,
        is_available: productForm.is_available,
        allows_delivery: productForm.allows_delivery,
        accepts_pix: productForm.accepts_pix,
        accepts_cash: productForm.accepts_cash,
        accepts_debit: productForm.accepts_debit,
        accepts_credit: productForm.accepts_credit,
        prep_time_minutes: productForm.prep_time_minutes ? parseInt(productForm.prep_time_minutes) : null,
        image_url
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('business_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Produto atualizado!' });
      } else {
        const { error } = await supabase
          .from('business_products')
          .insert(productData);

        if (error) throw error;
        toast({ title: 'Produto adicionado!' });
      }

      await fetchProducts(business!.id);
      setShowProductDialog(false);
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from('business_products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      toast({ title: 'Produto removido!' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o produto',
        variant: 'destructive'
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('business_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status } : o
      ));
      
      toast({ title: 'Status atualizado!' });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUS.find(s => s.value === status) || ORDER_STATUS[0];
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!business) return null;

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{business.business_name}</h1>
              {business.is_verified && (
                <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-muted-foreground">Gerencie sua loja empresarial</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to={`/empresa/${business.slug}`}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Loja
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/empresa/pagamentos">
                <BarChart3 className="w-4 h-4 mr-2" />
                Pagamentos
              </Link>
            </Button>
            <Button onClick={() => { resetProductForm(); setShowProductDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Pedidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalSales.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">
              Pedidos
              {pendingOrders > 0 && (
                <Badge className="ml-2 h-5 px-1.5" variant="destructive">
                  {pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {products.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione produtos para começar a vender
                  </p>
                  <Button onClick={() => { resetProductForm(); setShowProductDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative bg-muted">
                      {product.image_url ? (
                        <img 
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      {!product.is_available && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Badge variant="secondary">Indisponível</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        {(() => {
                          const catInfo = getCategoryInfo(product.category);
                          const CatIcon = catInfo.icon;
                          return (
                            <Badge variant="outline" className={`text-xs gap-1 ${catInfo.color} text-white border-0`}>
                              <CatIcon className="w-3 h-3" />
                              {product.category}
                            </Badge>
                          );
                        })()}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        {product.promotional_price ? (
                          <div>
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {product.price.toFixed(2)}
                            </span>
                            <span className="text-sm font-bold text-green-600 ml-1">
                              R$ {product.promotional_price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold">R$ {product.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => openEditProduct(product)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            {orders.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground">
                    Os pedidos aparecerão aqui quando clientes comprarem
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
                            <div>
                              <p className="font-mono font-bold">{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.customer?.full_name} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">R$ {order.total.toFixed(2)}</span>
                            {order.wants_delivery && (
                              <Badge variant="outline" className="gap-1">
                                <Truck className="w-3 h-3" />
                                Entrega
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {ORDER_STATUS.filter(s => s.value !== 'cancelled').map(status => (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={order.status === status.value ? 'default' : 'outline'}
                              onClick={() => updateOrderStatus(order.id, status.value)}
                              className="text-xs"
                            >
                              {status.label}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={(open) => { 
          if (!open) resetProductForm();
          setShowProductDialog(open);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <Label>Imagem do Produto</Label>
                  <label className="block mt-1 cursor-pointer">
                    <div className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>

                <div>
                  <Label htmlFor="prod_name">Nome do Produto *</Label>
                  <Input
                    id="prod_name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Bolo de Chocolate"
                  />
                </div>

                <div>
                  <Label htmlFor="prod_desc">Descrição</Label>
                  <Textarea
                    id="prod_desc"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o produto..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prod_price">Preço (R$) *</Label>
                    <Input
                      id="prod_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prod_promo">Preço Promocional</Label>
                    <Input
                      id="prod_promo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.promotional_price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, promotional_price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prod_cat">Categoria</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prod_stock">Estoque</Label>
                    <Input
                      id="prod_stock"
                      type="number"
                      min="0"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disponível para venda</Label>
                    <p className="text-xs text-muted-foreground">Produto visível na loja</p>
                  </div>
                  <Switch
                    checked={productForm.is_available}
                    onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>

                {business?.offers_delivery && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permite entrega</Label>
                      <p className="text-xs text-muted-foreground">Este produto pode ser entregue</p>
                    </div>
                    <Switch
                      checked={productForm.allows_delivery}
                      onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, allows_delivery: checked }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="prep_time">Tempo de preparo (minutos)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    min="0"
                    value={productForm.prep_time_minutes}
                    onChange={(e) => setProductForm(prev => ({ ...prev, prep_time_minutes: e.target.value }))}
                    placeholder="Ex: 30"
                  />
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Formas de Pagamento Aceitas</Label>
                    <p className="text-xs text-muted-foreground">
                      Você receberá na chave PIX configurada em Pagamentos. Não intermediamos!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="text-sm">PIX</span>
                      <Switch
                        checked={productForm.accepts_pix}
                        onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, accepts_pix: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="text-sm">Dinheiro</span>
                      <Switch
                        checked={productForm.accepts_cash}
                        onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, accepts_cash: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="text-sm">Débito</span>
                      <Switch
                        checked={productForm.accepts_debit}
                        onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, accepts_debit: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="text-sm">Crédito</span>
                      <Switch
                        checked={productForm.accepts_credit}
                        onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, accepts_credit: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Produto'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Product Alert */}
        <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover produto?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover "{deletingProduct?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pedido {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-muted-foreground">{selectedOrder.customer?.full_name}</p>
                    {selectedOrder.customer_phone && (
                      <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                    )}
                  </div>
                  {selectedOrder.customer_phone && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        const phone = selectedOrder.customer_phone?.replace(/\D/g, '');
                        const message = encodeURIComponent(
                          `Olá! Sobre seu pedido ${selectedOrder.order_number} em nossa loja.`
                        );
                        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                </div>

                {selectedOrder.wants_delivery && selectedOrder.delivery_address && (
                  <div>
                    <p className="text-sm font-medium">Endereço de entrega</p>
                    <p className="text-muted-foreground">{selectedOrder.delivery_address}</p>
                  </div>
                )}

                {selectedOrder.customer_notes && (
                  <div>
                    <p className="text-sm font-medium">Observações</p>
                    <p className="text-muted-foreground">{selectedOrder.customer_notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Itens</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>R$ {(item.product_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Entrega</span>
                      <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
