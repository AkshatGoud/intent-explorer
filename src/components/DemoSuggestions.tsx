import { motion } from 'framer-motion';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { DEMO_URLS } from '@/types';
import { cn } from '@/lib/utils';

interface DemoSuggestionsProps {
  onSelect: (url: string) => void;
}

export function DemoSuggestions({ onSelect }: DemoSuggestionsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Lightbulb className="w-4 h-4" />
        <span>Try these documentation sites for best results:</span>
      </div>
      
      <div className="grid gap-3">
        {DEMO_URLS.map((demo, index) => (
          <motion.button
            key={demo.url}
            onClick={() => onSelect(demo.url)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "glass-panel-hover p-4 text-left w-full",
              "flex items-center justify-between group"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {demo.label}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-muted-foreground">{demo.description}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground/60 hidden sm:block truncate max-w-[200px]">
              {demo.url}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
