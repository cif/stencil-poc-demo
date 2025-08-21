-- Remove foreign key constraint and index
DROP INDEX IF EXISTS idx_widgets_category_id;
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS fk_widgets_category;

-- Remove category_id column from widgets
ALTER TABLE widgets DROP COLUMN IF EXISTS category_id;

-- Drop categories table
DROP TABLE IF EXISTS categories;