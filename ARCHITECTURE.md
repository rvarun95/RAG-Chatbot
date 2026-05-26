# RAG Chatbot — Architecture

This document describes the architecture and data flow of the RAG (Retrieval Augmented Generation) Chatbot.

## High-Level Overview

The application has two main flows:

1. **Ingestion Flow** — Admin uploads a PDF; text is extracted, chunked, embedded, and stored in a vector database.
2. **Chat Flow** — User asks a question; relevant chunks are retrieved via semantic search and fed to the LLM as context.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        ChatUI["Chat UI<br/>/chat"]
        UploadUI["Upload UI<br/>/upload"]
    end

    subgraph Auth["Authentication"]
        Clerk["Clerk<br/>Middleware"]
    end

    subgraph NextApp["Next.js App"]
        ChatAPI["Chat Route Handler<br/>/api/chat"]
        UploadAction["Upload Server Action<br/>processPdfFile"]
        SearchLib["Search Library<br/>searchDocuments"]
        EmbedLib["Embeddings Library<br/>generateEmbedding(s)"]
        ChunkLib["Chunking Library<br/>RecursiveCharacterTextSplitter"]
        PDFLib["PDF Parser<br/>pdf-parse"]
    end

    subgraph External["External Services"]
        OpenAI["OpenAI<br/>gpt-4.1-mini<br/>text-embedding-3-small"]
        Neon[("Neon Postgres<br/>+ pgvector<br/>(HNSW index)")]
    end

    ChatUI -->|"Prompt"| Clerk
    UploadUI -->|"PDF File"| Clerk
    Clerk -->|"authenticated"| ChatAPI
    Clerk -->|"authenticated"| UploadAction

    ChatAPI -->|"tool: searchKnowledgeBase"| SearchLib
    SearchLib --> EmbedLib
    EmbedLib --> OpenAI
    SearchLib -->|"cosine similarity"| Neon
    ChatAPI -->|"streamText"| OpenAI
    ChatAPI -->|"stream response"| ChatUI

    UploadAction --> PDFLib
    UploadAction --> ChunkLib
    UploadAction --> EmbedLib
    UploadAction -->|"insert chunks + embeddings"| Neon
```

---

## RAG Chat Flow (Sequence)

```mermaid
sequenceDiagram
    participant UI as Chat UI
    participant API as Route Handler<br/>/api/chat
    participant Tool as Search Tool
    participant DB as Vector Database<br/>(Neon + pgvector)
    participant LLM as OpenAI LLM

    UI->>API: Prompt (user message)
    API->>Tool: searchKnowledgeBase(query)
    Tool->>LLM: generateEmbedding(query)
    LLM-->>Tool: query embedding
    Tool->>DB: semantic search (cosine similarity)
    DB-->>Tool: top-k relevant chunks
    Tool-->>API: formatted content
    API->>LLM: streamText(prompt + retrieved context)
    LLM-->>API: streamed tokens
    API-->>UI: stream response
```

---

## Ingestion Flow (Sequence)

```mermaid
sequenceDiagram
    participant UI as Upload UI
    participant Action as Server Action<br/>processPdfFile
    participant PDF as pdf-parse
    participant Split as TextSplitter
    participant Embed as Embeddings API
    participant DB as Vector Database

    UI->>Action: FormData (PDF file)
    Action->>PDF: parse PDF buffer
    PDF-->>Action: extracted text
    Action->>Split: chunkContent(text)
    Split-->>Action: text chunks
    Action->>Embed: generateEmbeddingsMany(chunks)
    Embed-->>Action: embedding vectors
    Action->>DB: insert(chunks + embeddings)
    DB-->>Action: success
    Action-->>UI: { success, message }
```

---

## Component Responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| Auth | [src/middleware.ts](src/middleware.ts) | Clerk-based route protection |
| Upload UI | [src/app/upload/page.tsx](src/app/upload/page.tsx) | PDF file picker, calls server action |
| Upload Action | [src/app/upload/action.ts](src/app/upload/action.ts) | Parse PDF, chunk, embed, store |
| Chat UI | [src/app/chat/page.tsx](src/app/chat/page.tsx) | Chat interface using `@ai-sdk/react` |
| Chat API | [src/app/api/chat/route.ts](src/app/api/chat/route.ts) | `streamText` with tool calling |
| Search | [src/lib/search.ts](src/lib/search.ts) | Cosine similarity search with threshold + fallback |
| Embeddings | [src/lib/embeddings.ts](src/lib/embeddings.ts) | OpenAI `text-embedding-3-small` |
| Chunking | [src/lib/chunking.ts](src/lib/chunking.ts) | LangChain `RecursiveCharacterTextSplitter` |
| Schema | [src/lib/db-schema.ts](src/lib/db-schema.ts) | Drizzle schema with `vector(1536)` + HNSW index |
| DB Config | [src/lib/db-config.ts](src/lib/db-config.ts) | Drizzle + Neon HTTP driver |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **AI SDK**: `ai` v6 + `@ai-sdk/openai`
- **LLM**: OpenAI `gpt-4.1-mini`
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Database**: Neon Postgres + pgvector (HNSW index, cosine distance)
- **ORM**: Drizzle ORM
- **Auth**: Clerk
- **UI**: shadcn/ui + Tailwind CSS v4
- **PDF Parsing**: `pdf-parse` v2
- **Chunking**: `@langchain/textsplitters`

---

## Data Model

```mermaid
erDiagram
    DOCUMENTS {
        serial id PK
        text content
        vector(1536) embedding
    }
```

- HNSW index on `embedding` using `vector_cosine_ops` for fast approximate nearest neighbor search.

---

## Retrieval Strategy

- **Top-k**: 5 candidates per query
- **Similarity threshold**: 0.35 (cosine similarity)
- **Fallback**: If no chunks meet the threshold, return the top candidates anyway so the LLM still has context to reason with.
