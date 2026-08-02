ALTER TABLE "products" ADD COLUMN "origin" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tasting_notes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint

UPDATE "products" AS p
SET
  "origin" = CASE WHEN s.n >= 2 THEN s.lines[1] END,
  "tasting_notes" = CASE WHEN s.n >= 3 THEN s.lines[2:s.n - 1] ELSE '{}'::text[] END,
  "description" = s.lines[s.n]
FROM (
  SELECT id, lines, COALESCE(array_length(lines, 1), 0) AS n
  FROM (
    SELECT
      id,
      ARRAY(
        SELECT btrim(line)
        FROM unnest(string_to_array("description", E'\n')) AS line
        WHERE btrim(line) <> ''
      ) AS lines
    FROM "products"
    WHERE "description" IS NOT NULL
  ) split
) s
WHERE p.id = s.id AND s.n >= 1;
