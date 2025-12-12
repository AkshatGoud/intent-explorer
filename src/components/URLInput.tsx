import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AnalysisParams, DEFAULT_PARAMS } from '@/types';
import { cn } from '@/lib/utils';

interface URLInputProps {
  onAnalyze: (url: string, params: AnalysisParams) => void;
  isLoading?: boolean;
  initialUrl?: string;
}

export function URLInput({ onAnalyze, isLoading, initialUrl = '' }: URLInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [params, setParams] = useState<AnalysisParams>(DEFAULT_PARAMS);
  const [error, setError] = useState<string | null>(null);

  // Update URL when initialUrl prop changes
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setError('Please enter a URL');
      return false;
    }
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`);
      setError(null);
      return true;
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      onAnalyze(normalizedUrl, params);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) validateUrl(e.target.value);
          }}
          placeholder="https://docs.example.com"
          className={cn(
            "h-14 pl-5 pr-32 text-lg glass-panel border-border/50",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
            error && "border-destructive/50"
          )}
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
              Analyzing
            </span>
          ) : (
            'Analyze'
          )}
        </Button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive pl-2"
        >
          {error}
        </motion.p>
      )}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Advanced Settings
          <ChevronDown className={cn(
            "w-4 h-4 ml-2 transition-transform",
            showAdvanced && "rotate-180"
          )} />
        </Button>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Max Pages</Label>
                  <span className="text-sm font-mono text-primary">{params.max_pages}</span>
                </div>
                <Slider
                  value={[params.max_pages]}
                  onValueChange={([value]) => setParams({ ...params, max_pages: value })}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Max Depth</Label>
                  <span className="text-sm font-mono text-primary">{params.max_depth}</span>
                </div>
                <Slider
                  value={[params.max_depth]}
                  onValueChange={([value]) => setParams({ ...params, max_depth: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Same Domain Only</Label>
                  <p className="text-xs text-muted-foreground">Only crawl pages on the same domain</p>
                </div>
                <Switch
                  checked={params.same_domain_only}
                  onCheckedChange={(checked) => setParams({ ...params, same_domain_only: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Force Recompute</Label>
                  <p className="text-xs text-muted-foreground">Ignore cached analysis</p>
                </div>
                <Switch
                  checked={params.force_recompute}
                  onCheckedChange={(checked) => setParams({ ...params, force_recompute: checked })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
