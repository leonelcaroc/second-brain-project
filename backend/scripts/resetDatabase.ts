import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const indexName = "transcripts";

    console.log("=== RESETTING PINECONE DATABASE ===");

    const existingIndexes = await pinecone.listIndexes();
    console.log("Existing indexes:", existingIndexes);

    const indexExists = existingIndexes.indexes?.some(
      (index) => index.name === indexName
    );

    if (indexExists) {
      console.log(`Deleting index: ${indexName}`);
      await pinecone.deleteIndex(indexName);
      console.log("Index deleted successfully");

      console.log("Waiting 30 seconds for index to be fully deleted...");
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }

    console.log("Creating new index...");
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

    console.log("✅ Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
