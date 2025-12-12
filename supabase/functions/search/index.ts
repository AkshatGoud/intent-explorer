import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

// Simple text to TF-IDF embedding
function textToEmbedding(text: string, vocabulary: Map<string, number>): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordCount = new Map<string, number>();
  
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }
  
  const embedding: number[] = new Array(vocabulary.size).fill(0);
  for (const [word, count] of wordCount) {
    const idx = vocabulary.get(word);
    if (idx !== undefined) {
      embedding[idx] = count / words.length;
    }
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  return embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { graph_id, query, top_k = 5 } = await req.json();

    if (!graph_id || !query) {
      return new Response(
        JSON.stringify({ error: 'graph_id and query are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching in graph ${graph_id}: "${query}"`);

    // Fetch all intents for this graph
    const { data: intents, error: intentsError } = await supabase
      .from('intents')
      .select('id, title, summary, keywords, centroid_embedding, size, source_urls, position, color_group')
      .eq('analysis_id', graph_id);

    if (intentsError) throw intentsError;

    if (!intents || intents.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build vocabulary from intent content
    const vocabulary = new Map<string, number>();
    let vocabIndex = 0;
    
    for (const intent of intents) {
      const text = `${intent.title} ${intent.summary} ${(intent.keywords as string[]).join(' ')}`;
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        if (!vocabulary.has(word) && vocabulary.size < 1000) {
          vocabulary.set(word, vocabIndex++);
        }
      }
    }

    // Embed query
    const queryEmbedding = textToEmbedding(query, vocabulary);

    // Score intents by similarity
    const scored = intents.map(intent => {
      // Combine centroid embedding with text-based similarity
      const textContent = `${intent.title} ${intent.summary} ${(intent.keywords as string[]).join(' ')}`;
      const intentEmbedding = textToEmbedding(textContent, vocabulary);
      
      const sim = cosineSimilarity(queryEmbedding, intentEmbedding);
      
      // Boost by keyword match
      const queryWords = new Set(query.toLowerCase().split(/\s+/));
      const keywords = intent.keywords as string[];
      const keywordBoost = keywords.filter(k => queryWords.has(k.toLowerCase())).length * 0.1;
      
      return {
        intent,
        score: Math.min(1, sim + keywordBoost),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, top_k).filter(r => r.score > 0.1);

    // Fetch evidence for top results
    const results = await Promise.all(topResults.map(async ({ intent, score }) => {
      const { data: evidence } = await supabase
        .from('evidence')
        .select('url, page_title, snippet')
        .eq('intent_id', intent.id)
        .limit(3);

      return {
        node_id: intent.id,
        score,
        title: intent.title,
        summary: intent.summary,
        keywords: intent.keywords,
        evidence: evidence || [],
      };
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
