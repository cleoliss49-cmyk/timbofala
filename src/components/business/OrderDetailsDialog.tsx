import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderChat } from './OrderChat';
import { 
  Phone, 
  MessageCircle, 
  Truck, 
  MapPin, 
  Receipt, 
  Eye,
  CheckCircle,
  Clock,
  Package,
  CreditCard,
  FileText,
  Calendar,
  User,
  ExternalLink,
  X
} from 'lucide-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
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
  items: OrderItem[];
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onViewReceipt: (url: string) => void;
  onConfirmPayment: (orderId: string) => void;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-200', icon: Clock },
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', icon: CreditCard },
  pending_confirmation: { label: 'Comprovante Enviado', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', icon: Receipt },
  confirmed: { label: 'Confirmado', color: 'text-green-700', bgColor: 'bg-green-100 border-green-200', icon: CheckCircle },
  preparing: { label: 'Em Preparo', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-200', icon: Package },
  ready: { label: 'Pronto', color: 'text-indigo-700', bgColor: 'bg-indigo-100 border-indigo-200', icon: Package },
  delivered: { label: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', icon: Truck },
  rejected: { label: 'Rejeitado', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', icon: X },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200', icon: X }
};

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  pix: { label: 'PIX', icon: '💳' },
  cash: { label: 'Dinheiro', icon: '💵' },
  debit: { label: 'Débito', icon: '💳' },
  credit: { label: 'Crédito', icon: '💳' }
};

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
  businessName,
  onViewReceipt,
  onConfirmPayment
}: OrderDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

  if (!order) return null;

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const paymentInfo = PAYMENT_LABELS[order.payment_method || 'pix'] || { label: order.payment_method, icon: '💳' };
  const isPendingReceipt = order.payment_status === 'pending_confirmation';
  const isPix = order.payment_method === 'pix';

  const formattedDate = format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Premium Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 ring-4 ring-background shadow-lg">
                <AvatarImage src={order.customer.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {order.customer.full_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">{order.customer.full_name}</h2>
                <p className="text-sm text-muted-foreground">@{order.customer.username}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Order Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono bg-background/50">
              <Package className="w-3.5 h-3.5" />
              {order.order_number}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-background/50">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </Badge>
            {order.wants_delivery && (
              <Badge className="gap-1.5 px-3 py-1 bg-blue-500 text-white border-0">
                <Truck className="w-3.5 h-3.5" />
                Delivery
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-muted/30">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === 'details' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Detalhes do Pedido
            </span>
            {activeTab === 'details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === 'chat' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat com Cliente
            </span>
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              {/* Receipt Alert - PIX Payment */}
              {isPendingReceipt && order.receipt_url && (
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">Comprovante Enviado</h4>
                      <p className="text-sm text-blue-700">O cliente enviou o comprovante de pagamento PIX</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewReceipt(order.receipt_url!)}
                        className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => onConfirmPayment(order.id)}
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show receipt preview if PIX and has receipt */}
              {isPix && order.receipt_url && !isPendingReceipt && (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Pagamento Confirmado</h4>
                        <p className="text-sm text-muted-foreground">Comprovante PIX verificado</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onViewReceipt(order.receipt_url!)}
                      className="gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Comprovante
                    </Button>
                  </div>
                </div>
              )}

              {/* Customer Contact Card */}
              <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contato do Cliente</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{order.customer.full_name}</p>
                    {order.customer_phone && (
                      <p className="text-muted-foreground">{order.customer_phone}</p>
                    )}
                  </div>
                  {order.customer_phone && (
                    <Button 
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        const phone = order.customer_phone?.replace(/\D/g, '');
                        const message = encodeURIComponent(
                          `Olá! Sobre seu pedido ${order.order_number} em nossa loja.`
                        );
                        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              {order.wants_delivery && order.delivery_address && (
                <div className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-background p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Endereço de Entrega</h4>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{order.delivery_address}</p>
                      {order.customer_neighborhood && (
                        <Badge variant="outline" className="mt-2">
                          {order.customer_neighborhood}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              {order.customer_notes && (
                <div className="rounded-xl border bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Observações do Cliente</h4>
                  </div>
                  <p className="text-foreground italic">"{order.customer_notes}"</p>
                </div>
              )}

              {/* Order Items */}
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm uppercase tracking-wide">Itens do Pedido</h4>
                  <Badge variant="secondary" className="ml-auto">
                    {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
                <div className="divide-y">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {item.quantity}x
                        </div>
                        <span className="font-medium">{item.product_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {(item.product_price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">R$ {item.product_price.toFixed(2)} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border overflow-hidden bg-gradient-to-br from-primary/5 to-background">
                <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm uppercase tracking-wide">Resumo do Pagamento</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.delivery_fee && order.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Taxa de Entrega
                      </span>
                      <span>R$ {order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-muted-foreground">Forma de Pagamento</span>
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                      <span>{paymentInfo.icon}</span>
                      {paymentInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
              <OrderChat
                orderId={order.id}
                businessName={businessName}
                customerName={order.customer.full_name}
                customerAvatar={order.customer.avatar_url}
                isBusinessView={true}
              />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
