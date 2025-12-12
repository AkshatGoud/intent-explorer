import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Scene3D } from '@/components/Scene3D';
import { BottomSearch } from '@/components/BottomSearch';
import { DetailPanel } from '@/components/DetailPanel';
import { ExplorerHeader } from '@/components/ExplorerHeader';
import { EmptyState } from '@/components/EmptyState';
import { GraphData, IntentNode } from '@/types';
import { useNodeDetails } from '@/hooks/useAnalysis';

interface ExplorerViewProps {
  graphData: GraphData;
  onBack: () => void;
}

export function ExplorerView({ graphData, onBack }: ExplorerViewProps) {
  const [selectedNode, setSelectedNode] = useState<IntentNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [showEdges, setShowEdges] = useState(true);
  const { isLoading: isLoadingEvidence, evidence, fetchDetails } = useNodeDetails();

  const handleNodeSelect = useCallback((node: IntentNode) => {
    setSelectedNode(node);
    fetchDetails(graphData.graph_id, node.id);
  }, [graphData.graph_id, fetchDetails]);

  const handleSearchResultSelect = useCallback((nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setHighlightedNodeIds([nodeId]);
      fetchDetails(graphData.graph_id, nodeId);
    }
  }, [graphData.nodes, graphData.graph_id, fetchDetails]);

  const handleResetView = useCallback(() => {
    setSelectedNode(null);
    setHighlightedNodeIds([]);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* 3D Graph Background */}
      <Scene3D
        nodes={graphData.nodes}
        edges={graphData.edges}
        selectedNodeId={selectedNode?.id ?? null}
        highlightedNodeIds={highlightedNodeIds}
        showEdges={showEdges}
        onNodeSelect={handleNodeSelect}
      />

      {/* Header */}
      <ExplorerHeader />

      {/* Control buttons - top right - moved down to avoid header overlap */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-24 right-6 z-20 flex items-center gap-3"
      >
        {/* Toggle Edges */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={showEdges ? "default" : "secondary"}
            size="icon"
            onClick={() => setShowEdges(!showEdges)}
            className={`
              glass-panel backdrop-blur-xl border-2 
              ${showEdges 
                ? 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/30' 
                : 'bg-secondary/50 border-border/50 hover:bg-secondary/70'
              }
              transition-all duration-200
            `}
            title={showEdges ? "Hide connection lines" : "Show connection lines"}
          >
            {showEdges ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
        </motion.div>

        {/* Reset View */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetView}
            className="glass-panel backdrop-blur-xl border-2 border-border/50 hover:border-primary/50 hover:text-primary transition-all duration-200"
            title="Reset view (deselect node)"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Back to Home */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            size="icon"
            onClick={onBack}
            className="glass-panel backdrop-blur-xl border-2 border-border/50 hover:border-primary/50 hover:text-primary transition-all duration-200"
            title="Back to home page"
          >
            <Home className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Empty state hint when no node selected */}
      <AnimatePresence>
        {!selectedNode && (
          <EmptyState message="Click a node to explore • Drag to rotate • Scroll to zoom" />
        )}
      </AnimatePresence>

      {/* Bottom search bar */}
      <BottomSearch
        graphId={graphData.graph_id}
        onResultSelect={handleSearchResultSelect}
      />

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            evidence={evidence}
            isLoading={isLoadingEvidence}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

