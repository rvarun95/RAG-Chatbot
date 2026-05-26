"use server";

import { PDFParse } from "pdf-parse";
import { db } from "@/src/lib/db-config";
import { documents } from "@/src/lib/db-schema";
import { generateEmbeddingsMany } from "@/src/lib/embeddings";
import { chunkContent } from "@/src/lib/chunking";

export async function processPdfFile(formData: FormData) {
    try {
        const fileEntry = formData.get("pdf") ?? formData.get("file");
        if (!(fileEntry instanceof File)) {
            return {
                success: false,
                message: "Please select a valid PDF file before uploading.",
            };
        }
        const file = fileEntry;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        if(!data.text || data.text.trim() === "") {
            return {
                success: false,
                message: "The uploaded PDF does not contain any text.",
            }
        }

        const chunks = await chunkContent(data.text); // Split the text into chunks
        const embeddings = await generateEmbeddingsMany(chunks); // Generate embeddings for each chunk

        // Store each chunk and its embedding in the database
        const records = chunks.map((chunk, index) => ({
            content: chunk,
            embedding: embeddings[index],
        }));
        await db.insert(documents).values(records); // Insert all records at once

        return {
            success: true,
            message: `Created ${records.length} searchable chunks and stored them in the database successfully.`,
        }

    } catch (error) {
        console.error("Error processing PDF:", error);
        return {
            success: false,
            message: "An error occurred while processing the PDF.",
            error: error instanceof Error ? error.message : 'Failed to process PDF',
        }
    }
}