-- Add computed fields using PostgreSQL functions

-- Function to compute price category
CREATE OR REPLACE FUNCTION get_price_category(widget_row widgets)
RETURNS TEXT AS $$
BEGIN
  IF widget_row.price < 50 THEN
    RETURN 'budget';
  ELSIF widget_row.price < 100 THEN
    RETURN 'mid-range';
  ELSIF widget_row.price < 200 THEN
    RETURN 'premium';
  ELSE
    RETURN 'luxury';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to compute days old
CREATE OR REPLACE FUNCTION get_days_old(widget_row widgets)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(DAY FROM NOW() - widget_row.created_at)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to compute stock status with business logic
CREATE OR REPLACE FUNCTION get_stock_status(widget_row widgets)
RETURNS TEXT AS $$
BEGIN
  IF NOT widget_row.in_stock THEN
    RETURN 'out-of-stock';
  ELSIF widget_row.price > 150 THEN
    RETURN 'low-stock';
  ELSE
    RETURN 'available';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for full-text search on widget content
CREATE OR REPLACE FUNCTION search_content(widget_row widgets)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(widget_row.name || ' ' || COALESCE(widget_row.description, ''));
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate value score (price vs features)
CREATE OR REPLACE FUNCTION get_value_score(widget_row widgets)
RETURNS NUMERIC AS $$
BEGIN
  -- Simple scoring: length of description / price * 100
  RETURN CASE 
    WHEN widget_row.price > 0 THEN 
      (LENGTH(COALESCE(widget_row.description, '')) / widget_row.price * 100)::NUMERIC(10,2)
    ELSE 
      0
  END;
END;
$$ LANGUAGE plpgsql STABLE;