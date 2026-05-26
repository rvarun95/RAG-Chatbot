import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "./db-config";
import { documents } from "./db-schema";
import { generateEmbedding } from "./embeddings";

export async function searchDocuments( 
    query: string, 
    limit: number= 5, 
    threshold: number = 0.7
) {
        const embedding = await generateEmbedding(query);

        const similarity = sql<number>`1 - (${cosineDistance(
            documents.embedding, 
            embedding
        )})`;

        const similarDocuments = await db.select({
            id: documents.id,
            content: documents.content,
            similarity: similarity,
        })
        .from(documents)
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

        if (similarDocuments.length > 0) {
            return similarDocuments;
        }

        // Fallback: if nothing passes the threshold, still return top candidates.
        const fallbackDocuments = await db.select({
            id: documents.id,
            content: documents.content,
            similarity: similarity,
        })
        .from(documents)
        .orderBy(desc(similarity))
        .limit(limit);

        return fallbackDocuments;
}