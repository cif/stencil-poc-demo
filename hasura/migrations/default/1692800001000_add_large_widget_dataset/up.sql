-- Insert 2000 additional widget records for caching tests
DO $$
DECLARE
    i INTEGER;
    categories TEXT[] := ARRAY['Premium', 'Standard', 'Eco-Friendly', 'Smart', 'Compact', 'Professional', 'Vintage', 'Performance', 'Budget', 'Luxury'];
    prefixes TEXT[] := ARRAY['Ultra', 'Basic', 'Eco', 'Smart', 'Mini', 'Pro', 'Retro', 'Turbo', 'Mega', 'Super', 'Advanced', 'Classic', 'Elite', 'Prime', 'Quantum'];
    suffixes TEXT[] := ARRAY['Widget', 'Device', 'Gadget', 'Tool', 'System', 'Unit', 'Component', 'Module', 'Apparatus', 'Mechanism'];
BEGIN
    FOR i IN 9..2008 LOOP
        INSERT INTO widgets (name, description, price, category, in_stock)
        VALUES (
            prefixes[1 + (i % array_length(prefixes, 1))] || ' ' || 
            suffixes[1 + (i % array_length(suffixes, 1))] || ' ' || 
            CASE 
                WHEN i % 10 = 0 THEN 'Pro'
                WHEN i % 7 = 0 THEN 'Max'
                WHEN i % 5 = 0 THEN 'Plus'
                ELSE 'v' || (i % 5 + 1)::TEXT
            END,
            
            'High-quality ' || 
            CASE 
                WHEN i % 4 = 0 THEN 'industrial-grade'
                WHEN i % 4 = 1 THEN 'consumer-friendly'
                WHEN i % 4 = 2 THEN 'professional-level'
                ELSE 'commercial-grade'
            END || 
            ' device designed for ' ||
            CASE 
                WHEN i % 3 = 0 THEN 'maximum efficiency and reliability'
                WHEN i % 3 = 1 THEN 'optimal performance and durability'
                ELSE 'enhanced functionality and user experience'
            END || '. Model #W' || i::TEXT,
            
            ROUND(
                (RANDOM() * 900 + 100)::NUMERIC, 2
            ),
            
            categories[1 + (i % array_length(categories, 1))],
            
            (i % 8) != 0  -- About 87.5% in stock
        );
    END LOOP;
END $$;