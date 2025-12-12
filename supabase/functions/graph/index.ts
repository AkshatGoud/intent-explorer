import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const url = new URL(req.url);
    const graphId = url.pathname.split('/').pop();

    if (!graphId) {
      return new Response(
        JSON.stringify({ error: 'Graph ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching graph: ${graphId}`);

    // Fetch analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', graphId)
      .single();

    if (analysisError || !analysis) {
      return new Response(
        JSON.stringify({ error: 'Analysis not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch intents
    const { data: intents, error: intentsError } = await supabase
      .from('intents')
      .select('id, title, summary, keywords, size, source_urls, position, color_group')
      .eq('analysis_id', graphId);

    if (intentsError) throw intentsError;

    // Fetch edges
    const { data: edges, error: edgesError } = await supabase
      .from('edges')
      .select('id, source_intent_id, target_intent_id, weight, reason')
      .eq('analysis_id', graphId);

    if (edgesError) throw edgesError;

    return new Response(
      JSON.stringify({
        graph_id: graphId,
        created_at: analysis.created_at,
        source_url: analysis.source_url,
        status: analysis.status,
        pages_crawled: analysis.pages_crawled,
        chunks_count: analysis.chunks_count,
        intents_count: analysis.intents_count,
        nodes: intents || [],
        edges: edges || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Graph fetch error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch graph' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
