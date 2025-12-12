import { useState, useCallback } from 'react';
import { Analysis, AnalysisParams, AnalysisStep, ANALYSIS_STEPS, DEFAULT_PARAMS, GraphData } from '@/types';

// Mock data for demo - in production this would call the backend
const mockGraphData: GraphData = {
  graph_id: 'demo-1',
  created_at: new Date().toISOString(),
  source_url: 'https://example.com',
  nodes: [
    {
      id: 'node-1',
      analysis_id: 'demo-1',
      title: 'Getting Started',
      summary: 'Introduction and setup guide for new users. Covers installation, configuration, and first steps.',
      keywords: ['setup', 'installation', 'quickstart', 'introduction'],
      centroid_embedding: [],
      size: 12,
      source_urls: ['https://example.com/docs/intro', 'https://example.com/docs/setup'],
      position: { x: 0, y: 0, z: 0 },
      color_group: 'cyan',
    },
    {
      id: 'node-2',
      analysis_id: 'demo-1',
      title: 'Core Concepts',
      summary: 'Fundamental principles and architecture patterns. Understanding the building blocks of the system.',
      keywords: ['concepts', 'architecture', 'fundamentals', 'principles'],
      centroid_embedding: [],
      size: 18,
      source_urls: ['https://example.com/docs/concepts', 'https://example.com/docs/architecture'],
      position: { x: 3, y: 1, z: -1 },
      color_group: 'purple',
    },
    {
      id: 'node-3',
      analysis_id: 'demo-1',
      title: 'API Reference',
      summary: 'Complete API documentation with endpoints, parameters, and examples for integration.',
      keywords: ['api', 'endpoints', 'reference', 'integration'],
      centroid_embedding: [],
      size: 24,
      source_urls: ['https://example.com/api/v1', 'https://example.com/api/reference'],
      position: { x: -2, y: 2, z: 2 },
      color_group: 'blue',
    },
    {
      id: 'node-4',
      analysis_id: 'demo-1',
      title: 'Authentication',
      summary: 'Security and authentication methods including OAuth, API keys, and session management.',
      keywords: ['auth', 'security', 'oauth', 'tokens'],
      centroid_embedding: [],
      size: 15,
      source_urls: ['https://example.com/docs/auth'],
      position: { x: 1, y: -2, z: 1 },
      color_group: 'teal',
    },
    {
      id: 'node-5',
      analysis_id: 'demo-1',
      title: 'Best Practices',
      summary: 'Recommended patterns and guidelines for optimal performance and maintainability.',
      keywords: ['best practices', 'patterns', 'guidelines', 'optimization'],
      centroid_embedding: [],
      size: 10,
      source_urls: ['https://example.com/docs/best-practices'],
      position: { x: -3, y: -1, z: -2 },
      color_group: 'pink',
    },
    {
      id: 'node-6',
      analysis_id: 'demo-1',
      title: 'Troubleshooting',
      summary: 'Common issues and solutions. Debug guides and error resolution strategies.',
      keywords: ['troubleshooting', 'debugging', 'errors', 'solutions'],
      centroid_embedding: [],
      size: 8,
      source_urls: ['https://example.com/docs/troubleshooting'],
      position: { x: 2, y: 1, z: 3 },
      color_group: 'cyan',
    },
  ],
  edges: [
    { id: 'e1', analysis_id: 'demo-1', source_intent_id: 'node-1', target_intent_id: 'node-2', weight: 0.85, reason: 'semantic_similarity' },
    { id: 'e2', analysis_id: 'demo-1', source_intent_id: 'node-2', target_intent_id: 'node-3', weight: 0.72, reason: 'semantic_similarity' },
    { id: 'e3', analysis_id: 'demo-1', source_intent_id: 'node-3', target_intent_id: 'node-4', weight: 0.68, reason: 'shared_pages' },
    { id: 'e4', analysis_id: 'demo-1', source_intent_id: 'node-2', target_intent_id: 'node-5', weight: 0.65, reason: 'semantic_similarity' },
    { id: 'e5', analysis_id: 'demo-1', source_intent_id: 'node-4', target_intent_id: 'node-6', weight: 0.55, reason: 'semantic_similarity' },
    { id: 'e6', analysis_id: 'demo-1', source_intent_id: 'node-1', target_intent_id: 'node-6', weight: 0.45, reason: 'shared_pages' },
  ],
};

const mockEvidence = [
  {
    id: 'ev-1',
    intent_id: 'node-1',
    page_id: 'p1',
    url: 'https://example.com/docs/intro',
    page_title: 'Introduction | Example Docs',
    snippet: 'Welcome to our platform. This guide will help you get started with the basics of installation and configuration.',
  },
  {
    id: 'ev-2',
    intent_id: 'node-1',
    page_id: 'p2',
    url: 'https://example.com/docs/setup',
    page_title: 'Setup Guide | Example Docs',
    snippet: 'Follow these steps to set up your development environment. First, install the required dependencies...',
  },
];

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
      // Simulate the analysis pipeline
      const stepDelay = 800;
      
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        setSteps(prev => prev.map((s, idx) => ({
          ...s,
          status: idx === i ? 'running' : idx < i ? 'complete' : 'pending'
        })));
        
        await new Promise(resolve => setTimeout(resolve, stepDelay));
        
        setSteps(prev => prev.map((s, idx) => ({
          ...s,
          status: idx <= i ? 'complete' : 'pending'
        })));
      }

      // Return mock data for demo
      const data = {
        ...mockGraphData,
        source_url: url,
      };
      
      setGraphData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setSteps(ANALYSIS_STEPS);
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
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock search results based on query
      const mockResults = mockGraphData.nodes
        .filter(node => 
          node.title.toLowerCase().includes(query.toLowerCase()) ||
          node.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
          node.summary.toLowerCase().includes(query.toLowerCase())
        )
        .map(node => ({
          node_id: node.id,
          score: Math.random() * 0.3 + 0.7,
          title: node.title,
          summary: node.summary,
          keywords: node.keywords,
          evidence: mockEvidence.filter(e => e.intent_id === node.id),
        }));
      
      setResults(mockResults);
      return mockResults;
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
  const [evidence, setEvidence] = useState<any[]>([]);

  const fetchDetails = useCallback(async (graphId: string, nodeId: string) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock evidence data
      setEvidence(mockEvidence);
      return mockEvidence;
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
