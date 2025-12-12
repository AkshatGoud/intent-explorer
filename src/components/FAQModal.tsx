import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Search, Eye, MousePointer, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const faqs = [
    {
      icon: Search,
      question: "How do I search for specific topics?",
      answer: "Use the search bar at the bottom to find nodes by typing keywords. The search is semantic - it understands meaning, not just exact words. Results are ranked by relevance."
    },
    {
      icon: MousePointer,
      question: "How do I interact with nodes?",
      answer: "Click any node to see its details in the side panel. Hover over nodes to see their names. The camera will smoothly fly to the selected node."
    },
    {
      icon: Eye,
      question: "What do the connection lines mean?",
      answer: "White lines connect related topics. You can toggle their visibility using the eye icon button in the top-right corner."
    },
    {
      icon: Zap,
      question: "What are the keyboard shortcuts?",
      answer: "Arrow keys: Navigate search results | Enter: Select result | Escape: Clear search and close panels | The camera auto-orbits after 2 seconds of inactivity."
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-hidden z-50"
          >
            <div className="glass-panel backdrop-blur-xl border-2 border-border/50 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20 border border-primary/50">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Quick Help</h2>
                    <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-secondary/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* FAQ List */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {faqs.map((faq, index) => {
                  const Icon = faq.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 border border-primary/20 h-fit">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground">{faq.question}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border/50 bg-secondary/20">
                <p className="text-xs text-center text-muted-foreground">
                  Need more help? Explore the graph to discover semantic connections between topics.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
