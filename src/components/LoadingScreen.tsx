import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-background z-50 flex items-center justify-center"
    >
      <div className="text-center">
        {/* Animated logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-primary/50"
            animate={{ scale: [1.1, 1, 1.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          
          {/* Inner ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-primary glow-primary"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold text-foreground mb-2"
        >
          IntentSpace
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground"
        >
          Initializing semantic space...
        </motion.p>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 w-48 h-1 bg-secondary rounded-full overflow-hidden mx-auto"
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
