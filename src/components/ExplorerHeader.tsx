import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export function ExplorerHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute top-0 left-0 right-0 z-20"
    >
      <div className="flex items-center justify-between p-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Compass className="w-8 h-8 text-primary" />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              IntentSpace
            </h1>
            <p className="text-xs text-muted-foreground">
              Semantic Navigation
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Connected</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
