// Types for IntentSpace application

export interface AnalysisParams {
  max_pages: number;
  max_depth: number;
  same_domain_only: boolean;
  force_recompute: boolean;
}

export interface Analysis {
  id: string;
  user_id: string | null;
  source_url: string;
  created_at: string;
  status: 'queued' | 'running' | 'ready' | 'error';
  params: AnalysisParams;
  pages_crawled: number;
  chunks_count: number;
  intents_count: number;
  error_message: string | null;
}

export interface Page {
  id: string;
  analysis_id: string;
  url: string;
  title: string;
  extracted_text: string;
  content_hash: string;
}

export interface Chunk {
  id: string;
  analysis_id: string;
  page_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding: number[];
}

export interface IntentNode {
  id: string;
  analysis_id: string;
  title: string;
  summary: string;
  keywords: string[];
  centroid_embedding: number[];
  size: number;
  source_urls: string[];
  position: { x: number; y: number; z: number };
  color_group: string;
}

export interface Edge {
  id: string;
  analysis_id: string;
  source_intent_id: string;
  target_intent_id: string;
  weight: number;
  reason: string;
}

export interface Evidence {
  id: string;
  intent_id: string;
  page_id: string;
  url: string;
  page_title: string;
  snippet: string;
}

export interface GraphData {
  graph_id: string;
  created_at: string;
  source_url: string;
  nodes: IntentNode[];
  edges: Edge[];
}

export interface SearchResult {
  node_id: string;
  score: number;
  title: string;
  summary: string;
  keywords: string[];
  evidence: Evidence[];
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  detail?: string;
}

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'discover', label: 'Discover', status: 'pending' },
  { id: 'fetch', label: 'Fetch', status: 'pending' },
  { id: 'extract', label: 'Extract', status: 'pending' },
  { id: 'chunk', label: 'Chunk', status: 'pending' },
  { id: 'embed', label: 'Embed', status: 'pending' },
  { id: 'cluster', label: 'Cluster', status: 'pending' },
  { id: 'graph', label: 'Graph', status: 'pending' },
];

export const DEFAULT_PARAMS: AnalysisParams = {
  max_pages: 50,
  max_depth: 3,
  same_domain_only: true,
  force_recompute: false,
};

export const DEMO_URLS = [
  {
    url: 'https://docs.github.com/en/get-started',
    label: 'GitHub Docs',
    description: 'Rich documentation with clear topic hierarchy',
  },
  {
    url: 'https://react.dev/learn',
    label: 'React Docs',
    description: 'Well-structured learning content',
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    label: 'MDN JavaScript',
    description: 'Comprehensive technical reference',
  },
];

// Unified color for all nodes - bright cyan for excellent contrast against dark background
export const NODE_COLORS = [
  'hsl(186, 100%, 70%)',  // bright cyan (used for all nodes)
];
