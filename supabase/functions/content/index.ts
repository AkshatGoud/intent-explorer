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
    const parts = url.pathname.split('/').filter(Boolean);
    const graphId = parts[parts.length - 2];
    const nodeId = parts[parts.length - 1];

    if (!graphId || !nodeId) {
      return new Response(
        JSON.stringify({ error: 'Graph ID and Node ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching content for node ${nodeId} in graph ${graphId}`);

    // Fetch intent
    const { data: intent, error: intentError } = await supabase
      .from('intents')
      .select('id, title, summary, keywords, size, source_urls, position, color_group')
      .eq('id', nodeId)
      .eq('analysis_id', graphId)
      .single();

    if (intentError || !intent) {
      return new Response(
        JSON.stringify({ error: 'Intent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch evidence
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('id, url, page_title, snippet')
      .eq('intent_id', nodeId);

    if (evidenceError) throw evidenceError;

    return new Response(
      JSON.stringify({
        node_id: intent.id,
        title: intent.title,
        summary: intent.summary,
        keywords: intent.keywords,
        size: intent.size,
        source_urls: intent.source_urls,
        evidence: evidence || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Content fetch error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
