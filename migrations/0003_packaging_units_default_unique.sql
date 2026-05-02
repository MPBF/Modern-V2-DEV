-- Enforce a single default packaging unit per item at the database level.
--
-- Application code in server/storage.ts already clears the previous default
-- before flagging a new one, but two concurrent requests could still slip past
-- that check and leave more than one default for the same item, which would
-- confuse the warehouse receipt screen.
--
-- A partial unique index on (item_id) WHERE is_default = true makes
-- "two defaults for the same item" impossible at the database level. Rows
-- with is_default = false (or NULL) are not covered by the index.

-- Step 1: defensively clean up any pre-existing duplicates so the index can
-- be created on databases that already contain conflicting data. For each
-- item_id with multiple defaults, keep the row with the lowest id and clear
-- the flag on the rest.
UPDATE "packaging_units" AS pu
SET "is_default" = false
WHERE pu."is_default" = true
  AND pu."id" <> (
    SELECT MIN(pu2."id")
    FROM "packaging_units" AS pu2
    WHERE pu2."item_id" = pu."item_id"
      AND pu2."is_default" = true
  );

-- Step 2: create the partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_packaging_units_default_per_item"
  ON "packaging_units" ("item_id")
  WHERE "is_default" = true;
