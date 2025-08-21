-- Insert 100,000 additional widget records for serious cache testing
DO $$
DECLARE
    i INTEGER;
    batch_size INTEGER := 1000;
    categories TEXT[] := ARRAY['Premium', 'Standard', 'Eco-Friendly', 'Smart', 'Compact', 'Professional', 'Vintage', 'Performance', 'Budget', 'Luxury', 'Enterprise', 'Consumer', 'Industrial', 'Medical', 'Educational'];
    prefixes TEXT[] := ARRAY['Ultra', 'Basic', 'Eco', 'Smart', 'Mini', 'Pro', 'Retro', 'Turbo', 'Mega', 'Super', 'Advanced', 'Classic', 'Elite', 'Prime', 'Quantum', 'Digital', 'Nano', 'Cyber', 'Alpha', 'Beta'];
    suffixes TEXT[] := ARRAY['Widget', 'Device', 'Gadget', 'Tool', 'System', 'Unit', 'Component', 'Module', 'Apparatus', 'Mechanism', 'Engine', 'Controller', 'Processor', 'Generator', 'Sensor'];
    materials TEXT[] := ARRAY['Carbon Fiber', 'Titanium', 'Aluminum', 'Steel', 'Polymer', 'Ceramic', 'Glass', 'Silicon', 'Copper', 'Graphene'];
    features TEXT[] := ARRAY['wireless connectivity', 'AI-powered automation', 'energy efficiency', 'modular design', 'waterproof construction', 'high-speed processing', 'precision engineering', 'sustainable materials', 'user-friendly interface', 'advanced sensors'];
BEGIN
    RAISE NOTICE 'Starting insertion of 100,000 widgets...';
    
    FOR batch_start IN 2009..102008 BY batch_size LOOP
        INSERT INTO widgets (name, description, price, category, in_stock)
        SELECT 
            prefixes[1 + (generate_series % array_length(prefixes, 1))] || ' ' || 
            suffixes[1 + (generate_series % array_length(suffixes, 1))] || ' ' || 
            CASE 
                WHEN generate_series % 20 = 0 THEN 'Elite'
                WHEN generate_series % 15 = 0 THEN 'Pro Max'
                WHEN generate_series % 10 = 0 THEN 'Pro'
                WHEN generate_series % 7 = 0 THEN 'Max'
                WHEN generate_series % 5 = 0 THEN 'Plus'
                ELSE 'v' || (generate_series % 9 + 1)::TEXT
            END || ' ' || 
            materials[1 + (generate_series % array_length(materials, 1))],
            
            'Premium ' || 
            materials[1 + (generate_series % array_length(materials, 1))] || 
            ' construction with ' ||
            features[1 + (generate_series % array_length(features, 1))] || 
            '. Features advanced ' ||
            CASE 
                WHEN generate_series % 6 = 0 THEN 'multi-core processing and real-time analytics'
                WHEN generate_series % 6 = 1 THEN 'machine learning algorithms and predictive maintenance'
                WHEN generate_series % 6 = 2 THEN 'cloud integration and remote monitoring capabilities'
                WHEN generate_series % 6 = 3 THEN 'blockchain security and encrypted data transmission'
                WHEN generate_series % 6 = 4 THEN 'quantum computing compatibility and ultra-fast response times'
                ELSE 'IoT connectivity and smart home integration'
            END || 
            '. Model #W' || generate_series::TEXT || 
            '-' || substr(md5(generate_series::text), 1, 8),
            
            ROUND((50 + (random() * 9950))::numeric, 2),  -- Price between $50-$10,000
            
            categories[1 + (generate_series % array_length(categories, 1))],
            
            (generate_series % 12) != 0  -- About 91.7% in stock
        FROM generate_series(batch_start, LEAST(batch_start + batch_size - 1, 102008)) AS generate_series;
        
        -- Progress logging every 10k records
        IF (batch_start - 2009) % 10000 = 0 THEN
            RAISE NOTICE 'Inserted % widgets so far...', batch_start - 2008;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed insertion of 100,000 widgets!';
END $$;