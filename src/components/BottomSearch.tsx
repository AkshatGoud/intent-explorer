import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useAnalysis';

interface BottomSearchProps {
  graphId: string;
  onResultSelect: (nodeId: string) => void;
}

export function BottomSearch({ graphId, onResultSelect }: BottomSearchProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { isSearching, results, search, clearResults } = useSearch();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(graphId, query);
        setSelectedIndex(-1);
        setShowDropdown(true); // Show dropdown when search starts
      } else {
        clearResults();
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, graphId, search, clearResults]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((nodeId: string) => {
    onResultSelect(nodeId);
    setQuery('');
    setShowDropdown(false);
    clearResults();
  }, [onResultSelect, clearResults]);

  const handleClear = useCallback(() => {
    setQuery('');
    clearResults();
    setSelectedIndex(-1);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [clearResults]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!results.length) {
      if (e.key === 'Escape') {
        handleClear();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex].node_id);
        } else if (results.length > 0) {
          handleSelect(results[0].node_id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClear();
        break;
    }
  }, [results, selectedIndex, handleSelect, handleClear]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex + 1] as HTMLElement; // +1 for header
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

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
            boxShadow: showDropdown
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
              onFocus={() => {
                if (query.trim()) {
                  setShowDropdown(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search intents..."
              className="flex-1 bg-transparent px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="mr-4 p-2 hover:bg-secondary/50 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showDropdown && (results.length > 0 || isSearching) && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-0 right-0 mb-2 glass-panel overflow-hidden max-h-[400px] overflow-y-auto"
            >
              {results.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b border-border/30 bg-secondary/30">
                    <p className="text-xs text-muted-foreground">
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {results.map((result, index) => (
                    <button
                      key={result.node_id}
                      onClick={() => handleSelect(result.node_id)}
                      className={`w-full text-left p-3 transition-colors border-b border-border/30 last:border-0 ${
                        index === selectedIndex
                          ? 'bg-primary/20 border-l-2 border-l-primary'
                          : 'hover:bg-secondary/50'
                      }`}
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
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for "<span className="text-foreground">{query}</span>"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
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
          Search by keywords, topics, or concepts
        </motion.p>
      )}

      {/* Keyboard hints */}
      {results.length > 0 && showDropdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-3"
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Clear</span>
        </motion.div>
      )}
    </motion.div>
  );
}
