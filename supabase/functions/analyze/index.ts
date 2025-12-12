import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for content deduplication
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Extract main content from HTML (simplified readability-like extraction)
function extractMainContent(html: string, url: string): { title: string; text: string } {
  // Remove scripts, styles, and comments
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : new URL(url).pathname;

  // Extract text content
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, text };
}

// Chunk text into overlapping segments
function chunkText(text: string, maxWords: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords - overlap) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    if (chunk.length > 100) { // Minimum chunk size
      chunks.push(chunk);
    }
    if (i + maxWords >= words.length) break;
  }
  
  return chunks;
}

// Simple TF-IDF based embedding (fallback when no LLM)
function computeTFIDFEmbedding(text: string, vocabulary: Map<string, number>): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordCount = new Map<string, number>();
  
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }
  
  const embedding: number[] = new Array(vocabulary.size).fill(0);
  for (const [word, count] of wordCount) {
    const idx = vocabulary.get(word);
    if (idx !== undefined) {
      embedding[idx] = count / words.length; // TF
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

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

// Simple k-means clustering
function kMeans(embeddings: number[][], k: number, maxIter: number = 20): number[] {
  if (embeddings.length === 0 || k <= 0) return [];
  k = Math.min(k, embeddings.length);
  
  const dim = embeddings[0].length;
  
  // Initialize centroids randomly
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * embeddings.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push([...embeddings[idx]]);
    }
  }
  
  let assignments = new Array(embeddings.length).fill(0);
  
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign points to nearest centroid
    const newAssignments = embeddings.map(emb => {
      let bestCluster = 0;
      let bestSim = -Infinity;
      for (let c = 0; c < k; c++) {
        const sim = cosineSimilarity(emb, centroids[c]);
        if (sim > bestSim) {
          bestSim = sim;
          bestCluster = c;
        }
      }
      return bestCluster;
    });
    
    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) break;
    assignments = newAssignments;
    
    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length > 0) {
        centroids[c] = new Array(dim).fill(0);
        for (const point of clusterPoints) {
          for (let d = 0; d < dim; d++) {
            centroids[c][d] += point[d];
          }
        }
        for (let d = 0; d < dim; d++) {
          centroids[c][d] /= clusterPoints.length;
        }
      }
    }
  }
  
  return assignments;
}

// Extract keywords using TF-IDF scores
function extractKeywords(texts: string[], topK: number = 5): string[] {
  const wordFreq = new Map<string, number>();
  const docFreq = new Map<string, number>();
  
  for (const text of texts) {
    const words = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !/^\d+$/.test(w)));
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      docFreq.set(word, (docFreq.get(word) || 0) + 1);
    }
  }
  
  const scores: [string, number][] = [];
  for (const [word, tf] of wordFreq) {
    const idf = Math.log(texts.length / (docFreq.get(word) || 1));
    scores.push([word, tf * idf]);
  }
  
  scores.sort((a, b) => b[1] - a[1]);
  return scores.slice(0, topK).map(([word]) => word);
}

// Generate summary from chunks (extractive)
function generateSummary(chunks: string[], maxSentences: number = 3): string {
  const allText = chunks.join(' ');
  const sentences = allText.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length <= maxSentences) {
    return sentences.join(' ').trim();
  }
  
  // Score sentences by keyword density
  const keywords = extractKeywords(chunks, 10);
  const scoredSentences = sentences.map(s => {
    const words = s.toLowerCase().split(/\s+/);
    const keywordCount = words.filter(w => keywords.includes(w)).length;
    return { sentence: s.trim(), score: keywordCount / words.length };
  });
  
  scoredSentences.sort((a, b) => b.score - a.score);
  return scoredSentences.slice(0, maxSentences).map(s => s.sentence).join(' ');
}

// Node color groups
const COLOR_GROUPS = ['cyan', 'purple', 'blue', 'teal', 'pink', 'gold', 'green'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { url, max_pages = 30, max_depth = 3, same_domain_only = true, force = false } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting analysis for: ${url}`);

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        source_url: url,
        status: 'running',
        params: { max_pages, max_depth, same_domain_only, force },
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Failed to create analysis:', analysisError);
      throw new Error('Failed to create analysis');
    }

    const analysisId = analysis.id;
    console.log(`Analysis ID: ${analysisId}`);

    try {
      // Step 1: Discover and fetch pages
      const baseUrl = new URL(url);
      const visited = new Set<string>();
      const toVisit: { url: string; depth: number }[] = [{ url, depth: 0 }];
      const pages: { url: string; title: string; text: string; hash: string }[] = [];

      while (toVisit.length > 0 && pages.length < max_pages) {
        const current = toVisit.shift()!;
        
        if (visited.has(current.url) || current.depth > max_depth) continue;
        visited.add(current.url);

        try {
          console.log(`Fetching: ${current.url}`);
          const response = await fetch(current.url, {
            headers: { 'User-Agent': 'IntentSpace/1.0' },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) continue;
          
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) continue;

          const html = await response.text();
          const { title, text } = extractMainContent(html, current.url);
          
          if (text.length < 200) continue; // Skip thin pages

          const hash = simpleHash(text);
          if (pages.some(p => p.hash === hash)) continue; // Skip duplicates

          pages.push({ url: current.url, title, text, hash });

          // Discover new links
          if (current.depth < max_depth) {
            const linkRegex = /href="([^"]+)"/g;
            let match;
            while ((match = linkRegex.exec(html)) !== null) {
              try {
                const linkUrl = new URL(match[1], current.url);
                if (same_domain_only && linkUrl.hostname !== baseUrl.hostname) continue;
                if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') continue;
                linkUrl.hash = '';
                const cleanUrl = linkUrl.toString();
                if (!visited.has(cleanUrl)) {
                  toVisit.push({ url: cleanUrl, depth: current.depth + 1 });
                }
              } catch {}
            }
          }
        } catch (fetchError) {
          console.log(`Failed to fetch ${current.url}:`, fetchError);
        }
      }

      console.log(`Fetched ${pages.length} pages`);

      if (pages.length === 0) {
        throw new Error('No pages could be fetched. The site may block automated access.');
      }

      // Step 2: Insert pages into database
      const pageRecords = pages.map(p => ({
        analysis_id: analysisId,
        url: p.url,
        title: p.title,
        extracted_text: p.text,
        content_hash: p.hash,
      }));

      const { data: insertedPages, error: pagesError } = await supabase
        .from('pages')
        .insert(pageRecords)
        .select();

      if (pagesError) throw pagesError;

      // Step 3: Chunk text
      const allChunks: { pageId: string; pageUrl: string; pageTitle: string; text: string; index: number }[] = [];
      
      for (const page of insertedPages) {
        const chunks = chunkText(page.extracted_text);
        chunks.forEach((text, index) => {
          allChunks.push({
            pageId: page.id,
            pageUrl: page.url,
            pageTitle: page.title,
            text,
            index,
          });
        });
      }

      console.log(`Created ${allChunks.length} chunks`);

      // Step 4: Build vocabulary and compute embeddings
      const vocabulary = new Map<string, number>();
      let vocabIndex = 0;
      
      for (const chunk of allChunks) {
        const words = chunk.text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        for (const word of words) {
          if (!vocabulary.has(word)) {
            vocabulary.set(word, vocabIndex++);
            if (vocabulary.size >= 5000) break; // Limit vocabulary size
          }
        }
      }

      const embeddings = allChunks.map(chunk => computeTFIDFEmbedding(chunk.text, vocabulary));

      // Insert chunks
      const chunkRecords = allChunks.map((chunk, i) => ({
        analysis_id: analysisId,
        page_id: chunk.pageId,
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: embeddings[i].slice(0, 100), // Store first 100 dims
      }));

      const { data: insertedChunks, error: chunksError } = await supabase
        .from('chunks')
        .insert(chunkRecords)
        .select();

      if (chunksError) throw chunksError;

      // Step 5: Cluster chunks
      const k = Math.max(6, Math.min(40, Math.floor(Math.sqrt(allChunks.length / 2))));
      console.log(`Clustering into ${k} intents`);
      
      const assignments = kMeans(embeddings, k);

      // Step 6: Create intent nodes
      const clusters = new Map<number, number[]>();
      assignments.forEach((cluster, idx) => {
        if (!clusters.has(cluster)) clusters.set(cluster, []);
        clusters.get(cluster)!.push(idx);
      });

      const intents: any[] = [];
      const intentEmbeddings: number[][] = [];

      for (const [clusterId, indices] of clusters) {
        if (indices.length < 2) continue; // Skip tiny clusters

        // Compute centroid
        const centroid = new Array(embeddings[0].length).fill(0);
        for (const idx of indices) {
          for (let d = 0; d < centroid.length; d++) {
            centroid[d] += embeddings[idx][d];
          }
        }
        for (let d = 0; d < centroid.length; d++) {
          centroid[d] /= indices.length;
        }

        // Get representative chunks (closest to centroid)
        const scored = indices.map(idx => ({
          idx,
          sim: cosineSimilarity(embeddings[idx], centroid)
        }));
        scored.sort((a, b) => b.sim - a.sim);
        const representatives = scored.slice(0, Math.min(8, indices.length));

        // Extract info from representatives
        const repChunks = representatives.map(r => allChunks[r.idx]);
        const repTexts = repChunks.map(c => c.text);
        const keywords = extractKeywords(repTexts, 5);
        const summary = generateSummary(repTexts, 2);
        const sourceUrls = [...new Set(repChunks.map(c => c.pageUrl))];
        
        // Generate title from keywords
        const title = keywords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ');

        // Random position in 3D space
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI - Math.PI / 2;
        const radius = 3 + Math.random() * 5;
        const position = {
          x: Math.cos(angle1) * Math.cos(angle2) * radius,
          y: Math.sin(angle2) * radius * 0.7,
          z: Math.sin(angle1) * Math.cos(angle2) * radius,
        };

        intents.push({
          analysis_id: analysisId,
          title,
          summary,
          keywords,
          centroid_embedding: centroid.slice(0, 100),
          size: indices.length,
          source_urls: sourceUrls,
          position,
          color_group: COLOR_GROUPS[intents.length % COLOR_GROUPS.length],
        });
        intentEmbeddings.push(centroid);
      }

      console.log(`Created ${intents.length} intents`);

      const { data: insertedIntents, error: intentsError } = await supabase
        .from('intents')
        .insert(intents)
        .select();

      if (intentsError) throw intentsError;

      // Step 7: Create edges between similar intents
      const edges: any[] = [];
      const edgeK = Math.min(4, insertedIntents.length - 1);

      for (let i = 0; i < insertedIntents.length; i++) {
        const similarities: { j: number; sim: number }[] = [];
        for (let j = 0; j < insertedIntents.length; j++) {
          if (i !== j) {
            const sim = cosineSimilarity(intentEmbeddings[i], intentEmbeddings[j]);
            similarities.push({ j, sim });
          }
        }
        similarities.sort((a, b) => b.sim - a.sim);
        
        for (let n = 0; n < Math.min(edgeK, similarities.length); n++) {
          const { j, sim } = similarities[n];
          // Avoid duplicate edges
          if (i < j && sim > 0.1) {
            edges.push({
              analysis_id: analysisId,
              source_intent_id: insertedIntents[i].id,
              target_intent_id: insertedIntents[j].id,
              weight: sim,
              reason: 'semantic_similarity',
            });
          }
        }
      }

      if (edges.length > 0) {
        await supabase.from('edges').insert(edges);
      }

      // Step 8: Create evidence records
      const evidenceRecords: any[] = [];
      
      for (const intent of insertedIntents) {
        const sourceUrls = intent.source_urls as string[];
        for (const sourceUrl of sourceUrls.slice(0, 3)) {
          const page = insertedPages.find(p => p.url === sourceUrl);
          if (page) {
            const snippet = page.extracted_text.slice(0, 200) + '...';
            evidenceRecords.push({
              intent_id: intent.id,
              page_id: page.id,
              url: page.url,
              page_title: page.title,
              snippet,
            });
          }
        }
      }

      if (evidenceRecords.length > 0) {
        await supabase.from('evidence').insert(evidenceRecords);
      }

      // Update analysis status
      await supabase
        .from('analyses')
        .update({
          status: 'ready',
          pages_crawled: pages.length,
          chunks_count: allChunks.length,
          intents_count: intents.length,
        })
        .eq('id', analysisId);

      return new Response(
        JSON.stringify({
          graph_id: analysisId,
          pages_crawled: pages.length,
          chunks: allChunks.length,
          intents: intents.length,
          status: 'ready',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update analysis with error
      await supabase
        .from('analyses')
        .update({
          status: 'error',
          error_message: processingError instanceof Error ? processingError.message : 'Processing failed',
        })
        .eq('id', analysisId);

      throw processingError;
    }

  } catch (error) {
    console.error('Analyze error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
