import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
}

interface Poll {
  id: string;
  question: string;
  ends_at: string;
  options: PollOption[];
}

interface PollDisplayProps {
  postId: string;
}

export function PollDisplay({ postId }: PollDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const fetchPoll = async () => {
    const { data: pollData } = await supabase
      .from('polls')
      .select('id, question, ends_at')
      .eq('post_id', postId)
      .maybeSingle();

    if (!pollData) {
      setLoading(false);
      return;
    }

    // Fetch options with vote counts
    const { data: optionsData } = await supabase
      .from('poll_options')
      .select('id, option_text')
      .eq('poll_id', pollData.id);

    // Get vote counts for each option
    const optionsWithCounts = await Promise.all(
      (optionsData || []).map(async (opt) => {
        const { count } = await supabase
          .from('poll_votes')
          .select('*', { count: 'exact', head: true })
          .eq('option_id', opt.id);
        return { ...opt, vote_count: count || 0 };
      })
    );

    // Check if user has voted
    if (user) {
      const { data: voteData } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', pollData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteData) {
        setUserVote(voteData.option_id);
      }
    }

    setPoll({
      ...pollData,
      options: optionsWithCounts,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchPoll();
  }, [postId, user]);

  const handleVote = async (optionId: string) => {
    if (!user || !poll || userVote || isPast(new Date(poll.ends_at))) return;

    setVoting(true);
    try {
      const { error } = await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });

      if (error) throw error;

      setUserVote(optionId);
      toast({ title: 'Voto registrado!' });
      fetchPoll();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível votar.',
        variant: 'destructive',
      });
    } finally {
      setVoting(false);
    }
  };

  if (loading || !poll) return null;

  const isEnded = isPast(new Date(poll.ends_at));
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const showResults = isEnded || userVote;

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
      <p className="font-medium">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
          const isSelected = userVote === option.id;

          return (
            <div key={option.id}>
              {showResults ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                      {option.option_text}
                      {isSelected && <CheckCircle2 className="inline w-4 h-4 ml-1 text-primary" />}
                    </span>
                    <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleVote(option.id)}
                  disabled={voting}
                >
                  {option.option_text}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        {isEnded ? (
          <span>Enquete encerrada · {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</span>
        ) : (
          <span>
            Encerra {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true, locale: ptBR })} · {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
          </span>
        )}
      </div>
    </div>
  );
}
