import { motion } from 'framer-motion';
import { Loader2, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { AnalysisStep } from '@/types';
import { cn } from '@/lib/utils';

interface ProgressTimelineProps {
  steps: AnalysisStep[];
}

export function ProgressTimeline({ steps }: ProgressTimelineProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 z-0" />
        <motion.div 
          className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-primary to-accent -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${(steps.filter(s => s.status === 'complete').length / steps.length) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
              step.status === 'complete' && "bg-primary text-primary-foreground shadow-glow",
              step.status === 'running' && "bg-secondary border-2 border-primary animate-pulse",
              step.status === 'pending' && "bg-muted border border-border",
              step.status === 'error' && "bg-destructive/20 border-2 border-destructive"
            )}>
              {step.status === 'complete' && <CheckCircle className="w-5 h-5" />}
              {step.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              {step.status === 'pending' && <Circle className="w-5 h-5 text-muted-foreground" />}
              {step.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
            </div>
            <span className={cn(
              "mt-2 text-xs font-medium transition-colors",
              step.status === 'complete' && "text-primary",
              step.status === 'running' && "text-foreground",
              step.status === 'pending' && "text-muted-foreground",
              step.status === 'error' && "text-destructive"
            )}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
