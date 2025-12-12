import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Tag,
  Link2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntentNode, Evidence } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DetailPanelProps {
  node: IntentNode | null;
  evidence: Evidence[];
  isLoading?: boolean;
  onClose: () => void;
}

export function DetailPanel({ node, evidence, isLoading, onClose }: DetailPanelProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState(false);

  if (!node) return null;

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(node.summary);
    setCopiedSummary(true);
    toast.success('Summary copied to clipboard');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyLinks = async () => {
    const links = node.source_urls.join('\n');
    await navigator.clipboard.writeText(links);
    setCopiedLinks(true);
    toast.success('Links copied to clipboard');
    setTimeout(() => setCopiedLinks(false), 2000);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[420px] glass-panel border-l z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {node.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {node.size} chunks
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {node.color_group}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySummary}
                  className="h-7 text-xs"
                >
                  {copiedSummary ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {node.summary}
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {node.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Source URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Sources ({node.source_urls.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLinks}
                  className="h-7 text-xs"
                >
                  {copiedLinks ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy all
                </Button>
              </div>
              <div className="space-y-1">
                {node.source_urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group py-1"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{url}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Evidence Snippets
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel p-4 space-y-2">
                      <div className="h-4 w-3/4 bg-muted/50 rounded shimmer" />
                      <div className="h-3 w-full bg-muted/30 rounded shimmer" />
                      <div className="h-3 w-2/3 bg-muted/30 rounded shimmer" />
                    </div>
                  ))}
                </div>
              ) : evidence.length > 0 ? (
                <div className="space-y-3">
                  {evidence.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-4 space-y-2 hover:border-primary/30 transition-colors"
                    >
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {ev.page_title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        "{ev.snippet}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No evidence snippets available
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}
