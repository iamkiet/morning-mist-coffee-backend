CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "embedding" halfvec(3072);--> statement-breakpoint
CREATE INDEX "products_embedding_hnsw_idx" ON "products" USING hnsw ("embedding" halfvec_cosine_ops);
