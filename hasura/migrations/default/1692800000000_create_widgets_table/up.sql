CREATE TABLE widgets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample widget data
INSERT INTO widgets (name, description, price, category, in_stock) VALUES
('Ultra Widget', 'High-performance widget with advanced features', 299.99, 'Premium', true),
('Basic Widget', 'Simple and reliable widget for everyday use', 49.99, 'Standard', true),
('Eco Widget', 'Environmentally friendly widget made from recycled materials', 79.99, 'Eco-Friendly', true),
('Smart Widget', 'IoT-enabled widget with mobile app connectivity', 199.99, 'Smart', false),
('Mini Widget', 'Compact widget perfect for small spaces', 29.99, 'Compact', true),
('Pro Widget', 'Professional-grade widget for industrial use', 449.99, 'Professional', true),
('Retro Widget', 'Classic vintage-style widget', 89.99, 'Vintage', true),
('Turbo Widget', 'High-speed widget with enhanced performance', 359.99, 'Performance', false);