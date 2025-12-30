import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface IdTooltipProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function IdTooltip({ id, children, className }: IdTooltipProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast({ title: 'ID copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="flex items-center gap-2 bg-card border border-border shadow-lg"
          onClick={handleCopy}
        >
          <span className="text-xs text-muted-foreground">id</span>
          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded max-w-[200px] truncate">
            {id}
          </code>
          <button 
            onClick={handleCopy}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
