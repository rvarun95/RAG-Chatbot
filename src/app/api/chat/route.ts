import { streamText, UIMessage, convertToModelMessages, tool, InferUITools, UIDataTypes, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searchDocuments } from "@/src/lib/search";

const tools = {
    searchKnowledgeBase: tool({
        description: "Search the knowledge base for relevant information.",
        inputSchema: z.object({
            query: z.string().describe("The search query to find relevant documents."),
        }),
        execute: async ({ query }) => {
            try {
                const results = await searchDocuments(query, 5, 0.35);

                if(results.length === 0) {
                    return "No relevant information found in the knowledge base.";
                }

                const formattedResults = results
                    .map(
                        (result, index) =>
                            `Result ${index + 1} (similarity: ${result.similarity.toFixed(3)}):\n${result.content}`,
                    )
                    .join("\n\n");
                return formattedResults;
            } catch (error) {
                console.error("Error searching knowledge base:", error);
                return "An error occurred while searching the knowledge base.";
            }
        }
    })
};

export type ChatTool = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTool>;

export async function POST(req: Request) {
    try {const { messages }: { messages: ChatMessage[] } = await req.json();

        const result = streamText({
            model: openai("gpt-4.1-mini"),
            messages: await convertToModelMessages(messages),
            tools,
            system: `You are a helpful assistant that provides information based on the knowledge base. 
                    Use the provided tools to search for relevant information when needed to answer user queries accurately. 
                    For questions about dates, schedules, minimum day, PK-8, or last day of school, call searchKnowledgeBase first.
                    If relevant results are found, answer directly from those results and do not ask the user for school name/location.
                    Always try to provide helpful and informative responses based on the user's input 
                    and the information available in the knowledge base.`,
            stopWhen: stepCountIs(2), // Limit the number of steps the model can take to prevent infinite loops
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error processing chat request:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}