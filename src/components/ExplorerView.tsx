import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  RotateCcw,
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

      {/* Control buttons - top right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 right-6 z-20 flex items-center gap-2"
      >
        <Button
          variant={showEdges ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setShowEdges(!showEdges)}
          title={showEdges ? "Hide edges" : "Show edges"}
          className="glass-panel"
        >
          {showEdges ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          title="Reset view"
          className="glass-panel"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          title="Back to home"
          className="glass-panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Button>
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

