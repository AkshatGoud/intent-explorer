import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Sparkles } from 'lucide-react';
import { URLInput } from '@/components/URLInput';
import { DemoSuggestions } from '@/components/DemoSuggestions';
import { ProgressTimeline } from '@/components/ProgressTimeline';
import { ExplorerView } from '@/components/ExplorerView';
import { AboutModal } from '@/components/AboutModal';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisParams } from '@/types';
import { toast } from 'sonner';

const Landing = () => {
  const [inputUrl, setInputUrl] = useState('');
  const { isAnalyzing, steps, graphData, error, analyze, reset } = useAnalysis();

  const handleAnalyze = useCallback(async (url: string, params: AnalysisParams) => {
    setInputUrl(url);
    try {
      await analyze(url, params);
      toast.success('Analysis complete! Explore the intent space.');
    } catch (err) {
      toast.error('Analysis failed. Please try again.');
    }
  }, [analyze]);

  const handleDemoSelect = useCallback((url: string) => {
    setInputUrl(url);
    // Let the user click analyze
  }, []);

  const handleBack = useCallback(() => {
    reset();
    setInputUrl('');
  }, [reset]);

  // Show explorer when we have graph data
  if (graphData) {
    return <ExplorerView graphData={graphData} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg">IntentSpace</span>
        </div>
        <AboutModal />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Analyzing</h2>
                <p className="text-muted-foreground font-mono text-sm truncate max-w-md mx-auto">
                  {inputUrl}
                </p>
              </div>

              <ProgressTimeline steps={steps} />

              <p className="text-center text-sm text-muted-foreground">
                This may take a minute depending on the site size...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-glow mb-4"
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-bold tracking-tight"
                >
                  <span className="gradient-text">IntentSpace</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-muted-foreground max-w-lg mx-auto"
                >
                  Navigate websites by meaning.
                  <br />
                  <span className="text-foreground/80">Explore content as a 3D semantic landscape.</span>
                </motion.p>
              </div>

              {/* URL Input */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <URLInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} initialUrl={inputUrl} />
              </motion.div>

              {/* Demo suggestions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <DemoSuggestions onSelect={handleDemoSelect} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 glass-panel p-6 max-w-md border-destructive/30"
            >
              <h3 className="font-medium text-destructive mb-2">Analysis Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={reset}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center text-sm text-muted-foreground">
        <p>IntentSpace — Semantic exploration for the web</p>
      </footer>
    </div>
  );
};

export default Landing;
