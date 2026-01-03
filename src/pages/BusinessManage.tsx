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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BusinessDashboard } from '@/components/business/BusinessDashboard';
import { StoreHoursEditor } from '@/components/business/StoreHoursEditor';
import { OrderDetailsDialog } from '@/components/business/OrderDetailsDialog';
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog';
import { 
  Package, Plus, Edit, Trash2, Eye, ExternalLink, 
  Upload, Loader2, ShoppingBag, Clock, CheckCircle, 
  XCircle, Truck, Store, BarChart3, Settings, Calendar,
  MessageCircle, Receipt, DollarSign, Users, Zap, TrendingUp,
  AlertCircle, Phone, AlertTriangle, Pencil
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
import { PRODUCT_CATEGORIES, getCategoryInfo } from '@/lib/productCategories';

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  offers_delivery: boolean;
  is_verified: boolean;
  opening_hours: any;
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
  payment_method: string | null;
  payment_status: string | null;
  receipt_url: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  wants_delivery: boolean;
  delivery_address: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  customer_neighborhood: string | null;
  created_at: string;
  customer_id: string;
  customer: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  items: {
    product_name: string;
    quantity: number;
    product_price: number;
  }[];
}

const ORDER_STATUS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'awaiting_payment', label: 'Aguardando Pag.', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'pending_confirmation', label: 'Comprovante', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'preparing', label: 'Preparando', color: 'bg-purple-500', textColor: 'text-purple-600' },
  { value: 'ready', label: 'Pronto', color: 'bg-indigo-500', textColor: 'text-indigo-600' },
  { value: 'delivered', label: 'Entregue', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-orange-600', textColor: 'text-orange-700' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-600' }
];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito'
};

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
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [savingName, setSavingName] = useState(false);

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

  useEffect(() => {
    if (business) {
      setupRealtimeOrders();
    }
  }, [business]);

  const setupRealtimeOrders = () => {
    if (!business) return;

    const channel = supabase
      .channel('business-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_orders',
          filter: `business_id=eq.${business.id}`
        },
        () => {
          fetchOrders(business.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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

    const ordersWithDetails = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: customer } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', order.customer_id)
          .single();

        const { data: items } = await supabase
          .from('business_order_items')
          .select('product_name, quantity, product_price')
          .eq('order_id', order.id);

        return {
          ...order,
          receipt_url: (order as any).receipt_url,
          payment_status: (order as any).payment_status,
          customer: customer || { full_name: 'Cliente', username: '', avatar_url: null },
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
      const updateData: any = { status };
      
      // If confirming payment, also update payment_status
      if (status === 'confirmed') {
        updateData.payment_status = 'confirmed';
      }

      const { error } = await supabase
        .from('business_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, ...updateData } : o
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

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('business_orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, payment_status: paymentStatus } : o
      ));
      
      toast({ title: paymentStatus === 'confirmed' ? '✅ Pagamento confirmado!' : 'Status atualizado!' });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Erro',
        variant: 'destructive'
      });
    }
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUS.find(s => s.value === status) || ORDER_STATUS[0];
  };

  const viewReceipt = (url: string) => {
    setReceiptUrl(url);
    setShowReceiptDialog(true);
  };

  const handleSaveBusinessName = async () => {
    if (!newBusinessName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Digite um nome para sua loja',
        variant: 'destructive'
      });
      return;
    }

    setSavingName(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ business_name: newBusinessName.trim() })
        .eq('id', business!.id);

      if (error) throw error;

      setBusiness(prev => prev ? { ...prev, business_name: newBusinessName.trim() } : null);
      setShowEditNameDialog(false);
      toast({ title: 'Nome atualizado com sucesso!' });
    } catch (error) {
      console.error('Error updating business name:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o nome',
        variant: 'destructive'
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteBusiness = async () => {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ is_active: false })
        .eq('id', business!.id);

      if (error) throw error;

      toast({ title: 'Loja excluída com sucesso' });
      navigate('/empresas');
    } catch (error) {
      console.error('Error deleting business:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a loja',
        variant: 'destructive'
      });
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
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
  const pendingReceipts = orders.filter(o => o.payment_status === 'pending_confirmation').length;
  const totalSales = orders
    .filter(o => !['cancelled', 'pending'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                {business.business_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{business.business_name}</h1>
                  {business.is_verified && (
                    <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">Painel de Controle</p>
              </div>
            </div>
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
                <DollarSign className="w-4 h-4 mr-2" />
                Pagamentos
              </Link>
            </Button>
            <Button onClick={() => { resetProductForm(); setShowProductDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(pendingOrders > 0 || pendingReceipts > 0) && (
          <div className="flex flex-wrap gap-3">
            {pendingOrders > 0 && (
              <Card className="flex-1 min-w-[200px] border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-800">{pendingOrders} novos pedidos</p>
                    <p className="text-xs text-yellow-700">Aguardando confirmação</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {pendingReceipts > 0 && (
              <Card className="flex-1 min-w-[200px] border-blue-200 bg-blue-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800">{pendingReceipts} comprovantes</p>
                    <p className="text-xs text-blue-700">Aguardando análise</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
              {(pendingOrders + pendingReceipts) > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {pendingOrders + pendingReceipts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <BusinessDashboard 
              businessId={business.id}
              orders={orders}
              onViewReceipt={viewReceipt}
              onViewOrder={(orderId) => {
                const order = orders.find(o => o.id === orderId);
                if (order) setSelectedOrder(order);
              }}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
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
                  const isPendingReceipt = order.payment_status === 'pending_confirmation';
                  
                  return (
                    <Card 
                      key={order.id} 
                      className={`overflow-hidden transition-all hover:shadow-md ${
                        isPendingReceipt ? 'ring-2 ring-blue-300' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Customer Info */}
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={order.customer.avatar_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {order.customer.full_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.customer.full_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
                            </div>
                          </div>

                          {/* Order Info */}
                          <div className="flex-1 flex flex-wrap items-center gap-3">
                            <Badge className={`${statusInfo.color} text-white border-0`}>
                              {statusInfo.label}
                            </Badge>
                            
                            {isPendingReceipt && (
                              <Badge variant="outline" className="border-blue-300 text-blue-600 gap-1">
                                <Receipt className="w-3 h-3" />
                                Comprovante
                              </Badge>
                            )}
                            
                            {order.payment_method && (
                              <Badge variant="secondary" className="text-xs">
                                {PAYMENT_LABELS[order.payment_method]}
                              </Badge>
                            )}
                            
                            {order.wants_delivery && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Truck className="w-3 h-3" />
                                Entrega
                              </Badge>
                            )}
                            
                            <span className="font-bold text-lg ml-auto">
                              R$ {order.total.toFixed(2)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {isPendingReceipt && order.receipt_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => viewReceipt(order.receipt_url!)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Comprovante
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Detalhes
                            </Button>
                          </div>
                        </div>

                        {/* Status Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {isPendingReceipt && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updatePaymentStatus(order.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmar Pagamento
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentStatus(order.id, 'rejected')}
                                className="text-red-600 border-red-300"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Recusar
                              </Button>
                              <Separator orientation="vertical" className="h-8" />
                            </>
                          )}
                          
                          {/* Reject Order Button - visible for pending orders */}
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'rejected')}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar Pedido
                            </Button>
                          )}
                          
                          {ORDER_STATUS.filter(s => 
                            !['cancelled', 'awaiting_payment', 'pending_confirmation', 'rejected'].includes(s.value)
                          ).map(status => (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={order.status === status.value ? 'default' : 'outline'}
                              onClick={() => updateOrderStatus(order.id, status.value)}
                              className={`text-xs ${order.status === status.value ? '' : status.textColor}`}
                            >
                              {status.label}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Store Name Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Informações da Loja
                </CardTitle>
                <CardDescription>Configure os dados básicos da sua loja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome da Loja</Label>
                    <p className="font-semibold text-lg">{business.business_name}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewBusinessName(business.business_name);
                      setShowEditNameDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Alterar Nome
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm text-muted-foreground">Link da Loja</Label>
                    <p className="font-mono text-sm">/empresa/{business.slug}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    asChild
                  >
                    <Link to={`/empresa/${business.slug}`} className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Visitar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Store Hours */}
            <StoreHoursEditor 
              businessId={business.id}
              initialHours={business.opening_hours}
              onSave={() => fetchBusiness()}
            />

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações irreversíveis - tenha cuidado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-destructive">Excluir Comércio</h4>
                      <p className="text-sm text-muted-foreground">
                        Sua loja ficará indisponível. Pedidos anteriores continuarão visíveis para os clientes.
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir Comércio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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

                {/* Payment Options */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Formas de Pagamento Aceitas</Label>
                    <p className="text-xs text-muted-foreground">
                      Você receberá na chave PIX configurada. Não intermediamos!
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

        {/* Order Details Dialog - New Professional UI */}
        <OrderDetailsDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          businessName={business.business_name}
          onViewReceipt={viewReceipt}
          onConfirmPayment={(orderId) => updatePaymentStatus(orderId, 'confirmed')}
        />

        {/* Receipt Dialog */}
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comprovante de Pagamento</DialogTitle>
            </DialogHeader>
            {receiptUrl && (
              <div className="flex justify-center">
                {receiptUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full text-center space-y-4">
                    <p className="text-muted-foreground">Arquivo PDF</p>
                    <Button asChild>
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir PDF
                      </a>
                    </Button>
                  </div>
                ) : (
                  <img 
                    src={receiptUrl} 
                    alt="Comprovante" 
                    className="max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Business Name Dialog */}
        <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar Nome da Loja</DialogTitle>
              <DialogDescription>
                Digite o novo nome para sua loja/empresa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_name">Novo Nome</Label>
                <Input
                  id="new_name"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Nome da loja"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditNameDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBusinessName} disabled={savingName}>
                {savingName ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Business Dialog */}
        <DeleteBusinessDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          businessName={business.business_name}
          onConfirmDelete={handleDeleteBusiness}
        />
      </div>
    </MainLayout>
  );
}
