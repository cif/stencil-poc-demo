-- Add back the category column and populate it from the relationship
ALTER TABLE widgets ADD COLUMN category VARCHAR(100);

UPDATE widgets 
SET category = categories.name 
FROM categories 
WHERE widgets.category_id = categories.id;