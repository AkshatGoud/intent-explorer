import { motion } from 'framer-motion';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "Click a node to explore • Drag to rotate • Scroll to zoom" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
    >
      <div className="glass-panel px-6 py-3 text-sm text-muted-foreground text-center">
        {message}
      </div>
    </motion.div>
  );
}
