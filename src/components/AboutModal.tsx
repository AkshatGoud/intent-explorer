import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const steps = [
  {
    title: 'Crawl',
    icon: '🔍',
    description: 'Discover and fetch pages from the target website, respecting limits and avoiding loops.',
  },
  {
    title: 'Extract',
    icon: '📝',
    description: 'Remove navigation, scripts, and boilerplate. Keep only the main content text.',
  },
  {
    title: 'Chunk',
    icon: '✂️',
    description: 'Split text into overlapping semantic chunks of ~300-800 words.',
  },
  {
    title: 'Embed',
    icon: '🧮',
    description: 'Convert chunks into vector embeddings that capture semantic meaning.',
  },
  {
    title: 'Cluster',
    icon: '🎯',
    description: 'Group similar chunks using k-means clustering to identify intent topics.',
  },
  {
    title: 'Graph',
    icon: '🕸️',
    description: 'Build a graph connecting related intents based on semantic similarity.',
  },
  {
    title: 'Explore',
    icon: '🚀',
    description: 'Navigate the 3D intent space and search in natural language.',
  },
];

export function AboutModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Info className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            How IntentSpace Works
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">
            IntentSpace transforms websites into explorable semantic landscapes by analyzing content and discovering intent clusters.
          </p>

          <div className="grid gap-4 mt-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-2xl">{step.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-primary mb-2">Grounded Results</h4>
            <p className="text-sm text-muted-foreground">
              Every intent is backed by evidence snippets with direct links to source pages. 
              No invented summaries — all content is derived from the actual website text.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
