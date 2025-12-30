import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gavel, TrendingUp, Check, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BidProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Bid {
  id: string;
  amount: number;
  user_id: string;
  created_at: string;
  profiles?: BidProfile;
}

interface Auction {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  min_bid: number;
  bid_increment_percent: number;
  status: string;
  winner_id: string | null;
  winning_bid: number | null;
}

interface AuctionDisplayProps {
  postId: string;
  isOwner: boolean;
}

export function AuctionDisplay({ postId, isOwner }: AuctionDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBidsDialog, setShowBidsDialog] = useState(false);

  const fetchAuction = async () => {
    const { data: auctionData } = await supabase
      .from('auctions')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();

    if (!auctionData) {
      setLoading(false);
      return;
    }

    setAuction(auctionData);

    // Fetch bids with profiles (only for owner or own bids)
    if (isOwner) {
      const { data: bidsData } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auctionData.id)
        .order('amount', { ascending: false });

      // Fetch profiles separately
      if (bidsData && bidsData.length > 0) {
        const userIds = [...new Set(bidsData.map(b => b.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        const bidsWithProfiles = bidsData.map(bid => ({
          ...bid,
          profiles: profilesData?.find(p => p.id === bid.user_id),
        }));
        setBids(bidsWithProfiles);
      } else {
        setBids([]);
      }
    } else if (user) {
      // Non-owner can only see their own bids
      const { data: ownBids } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auctionData.id)
        .eq('user_id', user.id)
        .order('amount', { ascending: false });

      setBids(ownBids || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAuction();
  }, [postId, user, isOwner]);

  const getMinBid = () => {
    if (!auction) return 0;
    if (bids.length === 0) return auction.min_bid;
    const highestBid = Math.max(...bids.map(b => b.amount));
    return highestBid * (1 + auction.bid_increment_percent / 100);
  };

  const handleBid = async () => {
    if (!user || !auction || auction.status !== 'open') return;

    const amount = parseFloat(bidAmount);
    const minBid = getMinBid();

    if (isNaN(amount) || amount < minBid) {
      toast({
        title: 'Lance inválido',
        description: `O lance mínimo é R$ ${minBid.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('auction_bids').insert({
        auction_id: auction.id,
        user_id: user.id,
        amount,
      });

      if (error) throw error;

      toast({ title: 'Lance registrado!' });
      setBidAmount('');
      fetchAuction();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer o lance.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!auction || !isOwner) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('auctions')
        .update({
          status: 'sold',
          winner_id: bid.user_id,
          winning_bid: bid.amount,
        })
        .eq('id', auction.id);

      if (error) throw error;

      toast({ title: 'Proposta aceita!' });
      fetchAuction();
      setShowBidsDialog(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar o lance.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !auction) return null;

  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : null;
  const minBid = getMinBid();

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Gavel className="w-5 h-5 text-primary" />
        <span className="font-semibold">Leilão</span>
        {auction.status === 'sold' ? (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            Vendido
          </Badge>
        ) : auction.status === 'closed' ? (
          <Badge variant="secondary">Encerrado</Badge>
        ) : (
          <Badge className="bg-primary/20 text-primary">Aberto</Badge>
        )}
      </div>

      <div>
        <h4 className="font-medium">{auction.title}</h4>
        {auction.description && (
          <p className="text-sm text-muted-foreground">{auction.description}</p>
        )}
      </div>

      {auction.image_url && (
        <img
          src={auction.image_url}
          alt={auction.title}
          className="w-full max-h-48 object-cover rounded-lg"
        />
      )}

      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Lance mínimo:</span>
          <span className="ml-1 font-semibold">R$ {auction.min_bid.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Incremento:</span>
          <span className="ml-1 font-semibold">{auction.bid_increment_percent}%</span>
        </div>
      </div>

      {highestBid && (
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="w-4 h-4" />
          <span className="font-semibold">Maior lance: R$ {highestBid.toFixed(2)}</span>
        </div>
      )}

      {auction.status === 'sold' && auction.winner_id && (
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-green-600 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            Leilão Fechado - Vendido por R$ {auction.winning_bid?.toFixed(2)}
          </p>
          {isOwner && auction.winner_id && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate(`/messages/${auction.winner_id}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar mensagem ao vencedor
            </Button>
          )}
        </div>
      )}

      {auction.status === 'open' && (
        <>
          {isOwner ? (
            <Button
              variant="outline"
              onClick={() => setShowBidsDialog(true)}
              className="w-full"
            >
              Ver lances ({bids.length})
            </Button>
          ) : (
            user && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Mínimo R$ ${minBid.toFixed(2)}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  step="0.01"
                  min={minBid}
                />
                <Button onClick={handleBid} disabled={submitting}>
                  Dar lance
                </Button>
              </div>
            )
          )}
        </>
      )}

      {/* Bids Dialog for Owner */}
      <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lances recebidos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {bids.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum lance recebido ainda.
              </p>
            ) : (
              bids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={bid.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {bid.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{bid.profiles?.full_name}</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {bid.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {auction.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptBid(bid)}
                      disabled={submitting}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aceitar
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
