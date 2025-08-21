-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert unique categories from existing widgets
INSERT INTO categories (name, description) 
SELECT DISTINCT 
    category as name,
    CASE 
        WHEN category = 'Premium' THEN 'High-end widgets with premium features and materials'
        WHEN category = 'Standard' THEN 'Reliable everyday widgets for general use'
        WHEN category = 'Eco-Friendly' THEN 'Environmentally conscious widgets made with sustainable practices'
        WHEN category = 'Smart' THEN 'IoT-enabled widgets with connectivity and smart features'
        WHEN category = 'Compact' THEN 'Space-saving widgets designed for minimal footprint'
        WHEN category = 'Professional' THEN 'Industrial-grade widgets for professional applications'
        WHEN category = 'Vintage' THEN 'Classic retro-style widgets with timeless appeal'
        WHEN category = 'Performance' THEN 'High-performance widgets optimized for speed and efficiency'
        WHEN category = 'Budget' THEN 'Cost-effective widgets without compromising on quality'
        WHEN category = 'Luxury' THEN 'Premium luxury widgets with exclusive features'
        WHEN category = 'Enterprise' THEN 'Enterprise-level widgets for large-scale operations'
        WHEN category = 'Consumer' THEN 'Consumer-friendly widgets for personal use'
        WHEN category = 'Industrial' THEN 'Heavy-duty widgets for industrial environments'
        WHEN category = 'Medical' THEN 'Medical-grade widgets for healthcare applications'
        WHEN category = 'Educational' THEN 'Educational widgets designed for learning environments'
        ELSE 'Specialized widgets for specific use cases'
    END as description
FROM widgets 
WHERE category IS NOT NULL
ORDER BY category;

-- Add category_id column to widgets table
ALTER TABLE widgets ADD COLUMN category_id INTEGER;

-- Update widgets to reference category IDs
UPDATE widgets 
SET category_id = categories.id 
FROM categories 
WHERE widgets.category = categories.name;

-- Add foreign key constraint
ALTER TABLE widgets 
ADD CONSTRAINT fk_widgets_category 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- Create index for better query performance
CREATE INDEX idx_widgets_category_id ON widgets(category_id);