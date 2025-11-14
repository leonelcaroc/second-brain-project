import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { processTranscripts } from "./utils/transcriptProcessor.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

app.post("/api/ingest", async (req: Request, res: Response) => {
  try {
    console.log("=== INGESTION START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { episodes } = req.body;

    if (!episodes || !Array.isArray(episodes)) {
      return res.status(400).json({ error: "Episodes array is required" });
    }

    console.log(`Processing ${episodes.length} episodes`);

    const index = pinecone.index("transcripts");

    const chunks = processTranscripts(episodes);
    console.log(`Created ${chunks.length} chunks from transcripts`);

    if (chunks.length === 0) {
      return res
        .status(400)
        .json({ error: "No chunks were created from the transcripts" });
    }

    const batchSize = 10;
    let successfulVectors = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} with ${
          batch.length
        } chunks`
      );

      const batchPromises = batch.map(async (chunk, batchIndex) => {
        try {
          console.log(`Processing chunk ${i + batchIndex}: ${chunk.chunkId}`);
          console.log(`Chunk content: "${chunk.content.substring(0, 50)}..."`);

          let embedding: number[];
          try {
            // Try OpenAI first
            const embeddingResponse = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: chunk.content,
            });
            embedding = embeddingResponse.data[0].embedding;
            console.log(`OpenAI embedding generated for ${chunk.chunkId}`);
          } catch (openaiError: any) {
            console.log(
              `OpenAI failed for ${chunk.chunkId}, using fallback:`,
              openaiError.message
            );
            // Use fallback embedding
            embedding = generateSimpleEmbedding(chunk.content);
            console.log(`Fallback embedding generated for ${chunk.chunkId}`);
          }

          const metadata: Record<string, string> = {
            episodeTitle: chunk.episodeTitle,
            content: chunk.content.substring(0, 1000),
            type: "transcript",
          };

          if (chunk.speaker) {
            metadata.speaker = chunk.speaker;
          }

          if (chunk.timestamp) {
            metadata.timestamp = chunk.timestamp;
          }

          console.log(`Chunk ${chunk.chunkId} ready for upsert`);
          return {
            id: chunk.chunkId,
            values: embedding,
            metadata: metadata,
          };
        } catch (error) {
          console.error(`Error processing chunk ${chunk.chunkId}:`, error);
          return null;
        }
      });

      const vectors = (await Promise.all(batchPromises)).filter(
        (v) => v !== null
      );

      console.log(
        `Batch ${Math.floor(i / batchSize) + 1}: ${
          vectors.length
        } vectors ready for upsert`
      );

      if (vectors.length > 0) {
        try {
          console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
          const upsertResult = await index.upsert(vectors);
          console.log(
            `Successfully upserted batch ${Math.floor(i / batchSize) + 1}`
          );
          successfulVectors += vectors.length;
        } catch (upsertError) {
          console.error(
            `Failed to upsert batch ${Math.floor(i / batchSize) + 1}:`,
            upsertError
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `=== INGESTION COMPLETE: ${successfulVectors} vectors stored ===`
    );

    res.json({
      success: true,
      message: `Successfully ingested ${successfulVectors} transcript chunks`,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    res.status(500).json({
      error: "Failed to ingest transcripts",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Searching for:", query);
    const index = pinecone.index("transcripts");

    let queryEmbedding: number[];
    try {
      console.log("Generating embedding with OpenAI...");
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (openaiError: any) {
      console.log(
        "OpenAI failed, using fallback embedding:",
        openaiError.message
      );
      // Use fallback embedding - now with correct dimensions
      queryEmbedding = generateSimpleEmbedding(query);
    }

    const results = await index.query({
      vector: queryEmbedding,
      topK: 8,
      includeMetadata: true,
    });

    const formattedResults = results.matches.map((match) => ({
      score: match.score,
      content: match.metadata?.content as string,
      episodeTitle: match.metadata?.episodeTitle as string,
      speaker: match.metadata?.speaker as string | undefined,
      timestamp: match.metadata?.timestamp as string | undefined,
    }));

    res.json({
      query,
      results: formattedResults,
      totalResults: formattedResults.length,
    });
  } catch (error) {
    console.error("Search error details:", error);
    res.status(500).json({
      error: "Search failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/status", async (req: Request, res: Response) => {
  try {
    console.log("Checking Pinecone status...");
    const index = pinecone.index("transcripts");
    const stats = await index.describeIndexStats();
    console.log("Pinecone stats:", stats);

    res.json({
      totalVectors: stats.totalRecordCount,
      indexStats: stats,
    });
  } catch (error) {
    console.error("Status error details:", error);
    res.status(500).json({
      error: "Failed to get status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Second Brain API is running!",
    endpoints: {
      ingest: "POST /api/ingest",
      search: "POST /api/search",
      status: "GET /api/status",
    },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0);

  words.forEach((word) => {
    const hash = Math.abs(
      word.split("").reduce((a, b) => {
        return (a << 5) - a + b.charCodeAt(0);
      }, 0)
    );
    const index = hash % 1536;
    embedding[index] += 1;
  });

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0));
}

async function initializePinecone() {
  try {
    const indexName = "transcripts";
    const existingIndexes = await pinecone.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === indexName)) {
      console.log("Creating Pinecone index...");
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });
      console.log("Index created successfully");

      console.log("Waiting for index to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    } else {
      console.log("Index already exists");
    }
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
  }
}

initializePinecone();

app.listen(PORT, () => {
  console.log(`Second Brain API running at http://localhost:${PORT}`);
});
