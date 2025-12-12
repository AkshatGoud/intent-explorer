import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useAnalysis';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  graphId: string;
  onResultSelect: (nodeId: string) => void;
}

export function SearchBox({ graphId, onResultSelect }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isSearching, results, search, clearResults } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(graphId, query);
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, graphId, search, clearResults]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nodeId: string) => {
    onResultSelect(nodeId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search intents..."
          className="pl-10 pr-10 h-10 bg-secondary/50 border-border/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('');
              clearResults();
              inputRef.current?.focus();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel overflow-hidden z-50"
          >
            {isSearching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={result.node_id}
                    onClick={() => handleSelect(result.node_id)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-secondary/50 transition-colors",
                      index !== results.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-foreground truncate">
                          {result.title}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.summary}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.keywords.slice(0, 3).map((kw: string) => (
                            <Badge
                              key={kw}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {(result.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : query && !isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
