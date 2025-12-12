import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Analysis, AnalysisParams, AnalysisStep, ANALYSIS_STEPS, DEFAULT_PARAMS, GraphData, IntentNode, Edge, Evidence } from '@/types';

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AnalysisStep[]>(ANALYSIS_STEPS);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string, params: AnalysisParams = DEFAULT_PARAMS) => {
    setIsAnalyzing(true);
    setError(null);
    setSteps(ANALYSIS_STEPS.map(s => ({ ...s, status: 'pending' })));

    try {
      // Start the animation for steps
      const stepLabels = ['discover', 'fetch', 'extract', 'chunk', 'embed', 'cluster', 'graph'];
      let currentStep = 0;

      const stepInterval = setInterval(() => {
        if (currentStep < stepLabels.length) {
          setSteps(prev => prev.map((s, idx) => ({
            ...s,
            status: idx === currentStep ? 'running' : idx < currentStep ? 'complete' : 'pending'
          })));
          currentStep++;
        }
      }, 2000);

      // Call the analyze edge function
      const { data, error: funcError } = await supabase.functions.invoke('analyze', {
        body: {
          url,
          max_pages: params.max_pages,
          max_depth: params.max_depth,
          same_domain_only: params.same_domain_only,
          force: params.force_recompute,
        },
      });

      clearInterval(stepInterval);

      if (funcError) {
        throw new Error(funcError.message || 'Analysis failed');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Mark all steps as complete
      setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));

      // Fetch the graph data
      const { data: graphResponse, error: graphError } = await supabase.functions.invoke('graph', {
        body: {},
        method: 'GET',
      });

      // Actually, we need to use fetch for GET requests with path params
      const graphUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph/${data.graph_id}`;
      const graphRes = await fetch(graphUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!graphRes.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const graph = await graphRes.json();

      const result: GraphData = {
        graph_id: graph.graph_id,
        created_at: graph.created_at,
        source_url: graph.source_url,
        nodes: (graph.nodes || []).map((node: any) => ({
          ...node,
          keywords: Array.isArray(node.keywords) ? node.keywords : [],
          source_urls: Array.isArray(node.source_urls) ? node.source_urls : [],
          position: node.position || { x: 0, y: 0, z: 0 },
        })),
        edges: (graph.edges || []).map((edge: any) => ({
          id: edge.id,
          analysis_id: graph.graph_id,
          source_intent_id: edge.source_intent_id,
          target_intent_id: edge.target_intent_id,
          weight: edge.weight,
          reason: edge.reason,
        })),
      };

      setGraphData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      setSteps(prev => prev.map(s => 
        s.status === 'running' ? { ...s, status: 'error' } : s
      ));
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setSteps(ANALYSIS_STEPS.map(s => ({ ...s, status: 'pending' })));
    setGraphData(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    steps,
    graphData,
    error,
    analyze,
    reset,
  };
}

export function useSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const search = useCallback(async (graphId: string, query: string) => {
    if (!query.trim()) {
      setResults([]);
      return [];
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('search', {
        body: { graph_id: graphId, query, top_k: 10 },
      });

      if (error) throw error;

      const searchResults = data.results || [];
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    isSearching,
    results,
    search,
    clearResults: () => setResults([]),
  };
}

export function useNodeDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  const fetchDetails = useCallback(async (graphId: string, nodeId: string) => {
    setIsLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content/${graphId}/${nodeId}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch details');

      const data = await res.json();
      const evidenceList = (data.evidence || []).map((e: any) => ({
        id: e.id || crypto.randomUUID(),
        intent_id: nodeId,
        page_id: e.page_id || '',
        url: e.url,
        page_title: e.page_title,
        snippet: e.snippet,
      }));

      setEvidence(evidenceList);
      return evidenceList;
    } catch (err) {
      console.error('Fetch details error:', err);
      setEvidence([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    evidence,
    fetchDetails,
  };
}
