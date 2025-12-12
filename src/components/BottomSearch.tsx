import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useAnalysis';

interface BottomSearchProps {
  graphId: string;
  onResultSelect: (nodeId: string) => void;
}

export function BottomSearch({ graphId, onResultSelect }: BottomSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSearching, results, search, clearResults } = useSearch();

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

  const handleSelect = (nodeId: string) => {
    onResultSelect(nodeId);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20"
    >
      <div className="relative">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 0 60px rgba(0, 212, 255, 0.3), 0 0 30px rgba(0, 212, 255, 0.2)'
              : '0 0 30px rgba(0, 212, 255, 0.1)',
          }}
          className="relative rounded-full overflow-hidden"
        >
          {/* Animated border gradient */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(185 100% 50% / 0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div className="relative flex items-center bg-secondary/80 backdrop-blur-xl border border-border/50 rounded-full">
            <div className="pl-6 text-muted-foreground">
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search intents..."
              className="flex-1 bg-transparent px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setQuery('');
                    clearResults();
                    inputRef.current?.focus();
                  }}
                  className="mr-2 px-5 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm 
                           flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Search
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {results.length > 0 && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-0 right-0 mb-2 glass-panel overflow-hidden max-h-[300px] overflow-y-auto"
            >
              {results.map((result, index) => (
                <button
                  key={result.node_id}
                  onClick={() => handleSelect(result.node_id)}
                  className="w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      {!query && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          What are you looking for?
        </motion.p>
      )}
    </motion.div>
  );
}
