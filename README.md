# RAG Chatbot

A Retrieval Augmented Generation (RAG) chatbot built with **Next.js 16**, the **AI SDK**, **OpenAI**, **Neon Postgres + pgvector**, and **Clerk** authentication.

Upload PDF documents into a vector knowledge base, then ask the chatbot natural-language questions. The chatbot retrieves the most relevant chunks via semantic search and streams grounded answers back to you.

> See [ARCHITECTURE.md](ARCHITECTURE.md) for diagrams and detailed component breakdown.

---

## Features

- **PDF ingestion** — Upload PDFs; text is parsed, chunked, and embedded.
- **Vector search** — Cosine-similarity search with HNSW index on pgvector.
- **Streaming chat** — Token-by-token streaming responses via the AI SDK.
- **Tool calling** — LLM invokes a `searchKnowledgeBase` tool to fetch context.
- **Authentication** — Clerk-protected routes (sign-in required).
- **Modern UI** — shadcn/ui + Tailwind CSS v4.

---

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| AI SDK | `ai` v6, `@ai-sdk/openai` |
| LLM | OpenAI `gpt-4.1-mini` |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Database | Neon Postgres + `pgvector` (HNSW index) |
| ORM / Migrations | Drizzle ORM + Drizzle Kit |
| Auth | Clerk |
| PDF parsing | `pdf-parse` v2 |
| Chunking | `@langchain/textsplitters` |
| UI | shadcn/ui, Tailwind CSS v4 |

---

## Prerequisites

- **Node.js** ≥ 20.16
- A **Neon** Postgres database (with `pgvector` extension enabled)
- An **OpenAI** API key
- A **Clerk** application (publishable + secret keys)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Neon Postgres connection string
NEON_DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 3. Enable pgvector & run migrations

In your Neon SQL editor (one-time):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then apply Drizzle migrations:

```bash
npx drizzle-kit push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Upload a PDF (Knowledge Base)

1. Sign in at `/sign-in`.
2. Navigate to [/upload](http://localhost:3000/upload).
3. Choose a PDF file.
4. The server extracts text, splits into chunks, embeds them, and stores them in the vector DB.

### Chat with your documents

1. Navigate to [/chat](http://localhost:3000/chat).
2. Ask a question related to the uploaded PDFs.
3. The chatbot retrieves relevant chunks and streams an answer.

---

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts        # Chat streaming endpoint with tool calling
│   ├── chat/page.tsx            # Chat UI
│   ├── upload/
│   │   ├── page.tsx             # PDF upload UI
│   │   └── action.ts            # Server action: parse → chunk → embed → store
│   ├── layout.tsx
│   └── page.tsx
├── components/                  # UI components (shadcn/ui + ai-elements)
├── lib/
│   ├── chunking.ts              # Text splitter
│   ├── db-config.ts             # Drizzle + Neon client
│   ├── db-schema.ts             # documents table + HNSW index
│   ├── embeddings.ts            # OpenAI embeddings helpers
│   └── search.ts                # Semantic search with threshold + fallback
├── middleware.ts                # Clerk route protection
└── types/globals.d.ts
migrations/                      # Drizzle migrations
```

---

## Key Implementation Notes

### Retrieval

[src/lib/search.ts](src/lib/search.ts) performs cosine-similarity search:

- **Top-k**: 5
- **Threshold**: 0.35
- **Fallback**: If no chunks pass the threshold, returns top candidates so the LLM still has context.

### Chat Route

[src/app/api/chat/route.ts](src/app/api/chat/route.ts) uses `streamText` from the AI SDK with a `searchKnowledgeBase` tool. The model decides when to call the tool, then composes a grounded answer.

### Schema

[src/lib/db-schema.ts](src/lib/db-schema.ts) defines a `documents` table with a `vector(1536)` column and an HNSW index using `vector_cosine_ops` for fast nearest-neighbor search.

---

## Admin-Only Upload (Optional)

The middleware contains a commented-out admin role check. To enable it:

1. In Clerk Dashboard, set a user's **Public metadata** to `{ "role": "admin" }`.
2. Add the role to your **Session token** (Clerk Dashboard → Sessions → Customize session token):
   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```
3. Uncomment the admin-check block in [src/middleware.ts](src/middleware.ts).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Push schema changes to the DB |
| `npx drizzle-kit generate` | Generate a new migration |

---

## License

MIT

