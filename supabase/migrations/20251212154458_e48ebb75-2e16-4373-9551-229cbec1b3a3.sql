-- IntentSpace Database Schema

-- Analyses table: stores analysis jobs
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'ready', 'error')),
  params JSONB NOT NULL DEFAULT '{}',
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  chunks_count INTEGER NOT NULL DEFAULT 0,
  intents_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Pages table: stores crawled pages
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  extracted_text TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT ''
);

-- Chunks table: stores text chunks
CREATE TABLE public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding JSONB
);

-- Intents table: stores clustered intent nodes
CREATE TABLE public.intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  keywords JSONB NOT NULL DEFAULT '[]',
  centroid_embedding JSONB,
  size INTEGER NOT NULL DEFAULT 0,
  source_urls JSONB NOT NULL DEFAULT '[]',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
  color_group TEXT
);

-- Edges table: stores connections between intents
CREATE TABLE public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  source_intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  target_intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  weight REAL NOT NULL DEFAULT 0.5,
  reason TEXT NOT NULL DEFAULT 'semantic_similarity'
);

-- Evidence table: stores grounding evidence for intents
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_pages_analysis_id ON public.pages(analysis_id);
CREATE INDEX idx_chunks_analysis_id ON public.chunks(analysis_id);
CREATE INDEX idx_intents_analysis_id ON public.intents(analysis_id);
CREATE INDEX idx_edges_analysis_id ON public.edges(analysis_id);
CREATE INDEX idx_evidence_intent_id ON public.evidence(intent_id);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses
-- Users can read their own analyses and public (guest) analyses
CREATE POLICY "Users can read own analyses" ON public.analyses
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create analyses" ON public.analyses
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own analyses" ON public.analyses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for pages (tied to analyses)
CREATE POLICY "Users can read pages from accessible analyses" ON public.pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = pages.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert pages for own analyses" ON public.pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = pages.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

-- RLS Policies for chunks
CREATE POLICY "Users can read chunks from accessible analyses" ON public.chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = chunks.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert chunks for own analyses" ON public.chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = chunks.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

-- RLS Policies for intents
CREATE POLICY "Users can read intents from accessible analyses" ON public.intents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = intents.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert intents for own analyses" ON public.intents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = intents.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

-- RLS Policies for edges
CREATE POLICY "Users can read edges from accessible analyses" ON public.edges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = edges.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert edges for own analyses" ON public.edges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = edges.analysis_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

-- RLS Policies for evidence
CREATE POLICY "Users can read evidence from accessible intents" ON public.evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.intents 
      JOIN public.analyses ON analyses.id = intents.analysis_id
      WHERE intents.id = evidence.intent_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert evidence for own analyses" ON public.evidence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intents 
      JOIN public.analyses ON analyses.id = intents.analysis_id
      WHERE intents.id = evidence.intent_id 
      AND (analyses.user_id = auth.uid() OR analyses.user_id IS NULL)
    )
  );