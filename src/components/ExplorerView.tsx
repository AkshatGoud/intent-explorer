import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Network,
  Eye,
  EyeOff,
  RotateCcw,
  Library,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Scene3D } from '@/components/Scene3D';
import { SearchBox } from '@/components/SearchBox';
import { DetailPanel } from '@/components/DetailPanel';
import { AboutModal } from '@/components/AboutModal';
import { GraphData, IntentNode, Evidence } from '@/types';
import { useNodeDetails } from '@/hooks/useAnalysis';
import { cn } from '@/lib/utils';

interface ExplorerViewProps {
  graphData: GraphData;
  onBack: () => void;
}

export function ExplorerView({ graphData, onBack }: ExplorerViewProps) {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<IntentNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [showEdges, setShowEdges] = useState(true);
  const { isLoading: isLoadingEvidence, evidence, fetchDetails } = useNodeDetails();

  // Mock evidence for demo
  const mockEvidence: Evidence[] = useMemo(() => {
    if (!selectedNode) return [];
    return [
      {
        id: 'ev-1',
        intent_id: selectedNode.id,
        page_id: 'p1',
        url: selectedNode.source_urls[0] || 'https://example.com',
        page_title: `${selectedNode.title} | Documentation`,
        snippet: `This section covers ${selectedNode.keywords.join(', ')}. ${selectedNode.summary.slice(0, 100)}...`,
      },
      {
        id: 'ev-2',
        intent_id: selectedNode.id,
        page_id: 'p2',
        url: selectedNode.source_urls[1] || 'https://example.com/guide',
        page_title: 'Getting Started Guide',
        snippet: `Learn more about ${selectedNode.title.toLowerCase()} and how to implement it effectively in your project.`,
      },
    ];
  }, [selectedNode]);

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
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Top Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel border-b border-border/30 px-4 py-3 flex items-center gap-4 z-40"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium truncate">{graphData.source_url}</span>
            <a
              href={graphData.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {graphData.nodes.length} intents • {graphData.edges.length} connections
          </p>
        </div>

        <div className="hidden md:block flex-1 max-w-md">
          <SearchBox
            graphId={graphData.graph_id}
            onResultSelect={handleSearchResultSelect}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showEdges ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setShowEdges(!showEdges)}
            title={showEdges ? "Hide edges" : "Show edges"}
          >
            {showEdges ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetView}
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            title="Library"
          >
            <Library className="w-4 h-4" />
          </Button>

          <AboutModal />
        </div>
      </motion.header>

      {/* Mobile search */}
      <div className="md:hidden px-4 py-2 border-b border-border/30">
        <SearchBox
          graphId={graphData.graph_id}
          onResultSelect={handleSearchResultSelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <Scene3D
          nodes={graphData.nodes}
          edges={graphData.edges}
          selectedNodeId={selectedNode?.id ?? null}
          highlightedNodeIds={highlightedNodeIds}
          showEdges={showEdges}
          onNodeSelect={handleNodeSelect}
        />

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              evidence={mockEvidence}
              isLoading={isLoadingEvidence}
              onClose={handleClosePanel}
            />
          )}
        </AnimatePresence>

        {/* Instructions overlay */}
        <AnimatePresence>
          {!selectedNode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="glass-panel px-4 py-2 text-sm text-muted-foreground">
                Click a node to see details • Drag to rotate • Scroll to zoom
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
