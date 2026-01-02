import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, MapPin, Phone, Mail, Globe, Clock, Truck, 
  ShoppingCart, Plus, Minus, MessageCircle, Instagram, 
  Facebook, CheckCircle, Star, Package, Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  offers_delivery: boolean;
  delivery_fee: number | null;
  min_order_value: number | null;
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

interface CartItem {
  product: Product;
  quantity: number;
  wants_delivery: boolean;
}

export default function Business() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    phone: '',
    address: '',
    notes: '',
    wants_delivery: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const isOwner = user?.id === business?.user_id;

  useEffect(() => {
    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (businessError) throw businessError;
      
      if (!businessData) {
        navigate('/empresas');
        return;
      }

      setBusiness(businessData);

      const { data: productsData, error: productsError } = await supabase
        .from('business_products')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a loja',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, wants_delivery: business?.offers_delivery || false }];
    });
    toast({
      title: 'Adicionado ao carrinho',
      description: product.name
    });
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const toggleDelivery = (productId: string, wants_delivery: boolean) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, wants_delivery } : item
      )
    );
  };

  const getProductPrice = (product: Product) => {
    return product.promotional_price || product.price;
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);
  };

  const calculateDeliveryFee = () => {
    const hasDeliveryItems = cart.some(item => item.wants_delivery && item.product.allows_delivery);
    return hasDeliveryItems && business?.offers_delivery ? (business.delivery_fee || 0) : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para finalizar a compra',
        variant: 'destructive'
      });
      return;
    }

    if (!checkoutData.phone) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Por favor, informe seu telefone de contato',
        variant: 'destructive'
      });
      return;
    }

    const hasDelivery = cart.some(item => item.wants_delivery);
    if (hasDelivery && !checkoutData.address) {
      toast({
        title: 'Endereço obrigatório',
        description: 'Por favor, informe o endereço de entrega',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Generate order number
      const orderNumber = 'TF' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('business_orders')
        .insert({
          order_number: orderNumber,
          business_id: business!.id,
          customer_id: user.id,
          subtotal: calculateSubtotal(),
          delivery_fee: calculateDeliveryFee(),
          total: calculateTotal(),
          wants_delivery: hasDelivery,
          delivery_address: hasDelivery ? checkoutData.address : null,
          customer_phone: checkoutData.phone,
          customer_notes: checkoutData.notes || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: getProductPrice(item.product),
        quantity: item.quantity,
        subtotal: getProductPrice(item.product) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('business_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Pedido realizado!',
        description: `Número do pedido: ${order.order_number}`
      });

      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setCheckoutData({ phone: '', address: '', notes: '', wants_delivery: false });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o pedido',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['todos', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          <Skeleton className="w-full h-48 rounded-xl" />
          <Skeleton className="w-48 h-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!business) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <Store className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loja não encontrada</h2>
          <Button onClick={() => navigate('/empresas')}>Ver todas as lojas</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header/Cover */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {business.cover_url ? (
            <img 
              src={business.cover_url} 
              alt={business.business_name}
              className="w-full h-48 md:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-64 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Store className="w-20 h-20 text-primary/40" />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6">
            <div className="flex items-end gap-4">
              {business.logo_url ? (
                <img 
                  src={business.logo_url}
                  alt={business.business_name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-4 border-background object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-4 border-background bg-primary/20 flex items-center justify-center shadow-lg">
                  <Store className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold">{business.business_name}</h1>
                  {business.is_verified && (
                    <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary">{business.category}</Badge>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {business.neighborhood ? `${business.neighborhood}, ` : ''}{business.city}
                  </span>
                </div>
              </div>
              {isOwner && (
                <Button variant="outline" size="sm" onClick={() => navigate('/empresa/gerenciar')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Info & Contact */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-4 space-y-4">
              {business.description && (
                <p className="text-muted-foreground">{business.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    {business.phone}
                  </a>
                )}
                {business.whatsapp && (
                  <a href={`https://wa.me/55${business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {business.email && (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                    {business.email}
                  </a>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-4 h-4" />
                    Site
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {business.instagram && (
                  <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="gap-1">
                      <Instagram className="w-3 h-3" />
                      @{business.instagram}
                    </Badge>
                  </a>
                )}
                {business.facebook && (
                  <a href={business.facebook} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="gap-1">
                      <Facebook className="w-3 h-3" />
                      Facebook
                    </Badge>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              {business.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>{business.address}</span>
                </div>
              )}
              
              {business.offers_delivery && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">Faz entregas</span>
                  {business.delivery_fee && business.delivery_fee > 0 && (
                    <span className="text-muted-foreground">
                      (R$ {business.delivery_fee.toFixed(2)})
                    </span>
                  )}
                </div>
              )}
              
              {business.min_order_value && business.min_order_value > 0 && (
                <div className="text-sm text-muted-foreground">
                  Pedido mínimo: R$ {business.min_order_value.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat === 'todos' ? 'Todos' : cat}
              </Button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-muted">
                {product.image_url ? (
                  <img 
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                {product.promotional_price && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    Promoção
                  </Badge>
                )}
                {product.allows_delivery && business?.offers_delivery && (
                  <Badge variant="secondary" className="absolute top-2 left-2 gap-1">
                    <Truck className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium line-clamp-2">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {product.promotional_price ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-green-600 ml-1">
                          R$ {product.promotional_price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        R$ {product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => addToCart(product)}
                  disabled={isOwner}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto disponível</p>
          </div>
        )}

        {/* Floating Cart Button */}
        {cart.length > 0 && !isOwner && (
          <Button
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 rounded-full shadow-lg z-50 h-14 px-6"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
            <Separator orientation="vertical" className="mx-3 h-6 bg-white/30" />
            R$ {calculateTotal().toFixed(2)}
          </Button>
        )}

        {/* Cart Dialog */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Seu Carrinho
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4 pr-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-sm text-primary font-semibold">
                        R$ {(getProductPrice(item.product) * item.quantity).toFixed(2)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {item.product.allows_delivery && business?.offers_delivery && (
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            id={`delivery-${item.product.id}`}
                            checked={item.wants_delivery}
                            onCheckedChange={(checked) => toggleDelivery(item.product.id, checked)}
                          />
                          <Label htmlFor={`delivery-${item.product.id}`} className="text-xs">
                            Entrega
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              {calculateDeliveryFee() > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {calculateDeliveryFee().toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCart(false)}>
                Continuar comprando
              </Button>
              <Button onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                Finalizar pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checkout Dialog */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Pedido</DialogTitle>
              <DialogDescription>
                Preencha seus dados para enviar o pedido para {business.business_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefone para contato *</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={checkoutData.phone}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {cart.some(item => item.wants_delivery) && (
                <div>
                  <Label htmlFor="address">Endereço de entrega *</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua, número, bairro, complemento..."
                    value={checkoutData.address}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Alguma observação sobre o pedido..."
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
                      <span>R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {calculateDeliveryFee() > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Entrega</span>
                        <span>R$ {calculateDeliveryFee().toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCheckout(false)}>
                Voltar
              </Button>
              <Button onClick={handleCheckout} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Confirmar Pedido'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
