import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useWidgetsWithComputedFields } from './client-logic';

// Server-side computed fields query
const GET_WIDGETS_WITH_SERVER_COMPUTED = gql`
  query GetWidgetsWithServerComputed($limit: Int!) {
    widgets(limit: $limit, order_by: { price: desc }) {
      id
      name
      price
      created_at
      # Server-side computed fields (calculated in PostgreSQL)
      price_category
      days_old  
      value_score
    }
  }
`;

export const ComputedFieldsDemo: React.FC = () => {
  // Client-side computed fields
  const { data: clientData, loading: clientLoading } = useWidgetsWithComputedFields(5, 1);
  
  // Server-side computed fields
  const { data: serverData, loading: serverLoading } = useQuery(GET_WIDGETS_WITH_SERVER_COMPUTED, {
    variables: { limit: 5 }
  });

  if (clientLoading || serverLoading) return <p>Loading computed fields demo...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ textAlign: 'left' }}>🧮 Computed Fields Demo</h1>
      <p style={{ marginBottom: '30px', color: '#666', textAlign: 'left' }}>
        Comparison of client-side vs server-side computed fields
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Client-Side Computed Fields */}
        <div>
          <h2 style={{ textAlign: 'left' }}>🖥️ Client-Side Computed Fields</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px', textAlign: 'left' }}>
            Computed in Apollo Client using field policies or hooks
          </p>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
            <h4 style={{ textAlign: 'left', margin: '0 0 8px 0' }}>Advantages:</h4>
            <ul style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0', paddingLeft: '20px', textAlign: 'left' }}>
              <li>No server round-trip - instant computation</li>
              <li>Can use client-side state & browser APIs</li>
              <li>Reduces server load</li>
              <li>Works offline</li>
            </ul>
            <h4 style={{ textAlign: 'left', margin: '0 0 8px 0' }}>Disadvantages:</h4>
            <ul style={{ fontSize: '13px', color: '#666', margin: '0', paddingLeft: '20px', textAlign: 'left' }}>
              <li>Computed on every render</li>
              <li>Can't be used in server queries/filtering</li>
              <li>Inconsistent across clients</li>
            </ul>
          </div>

          {clientData?.widgets.slice(0, 3).map(widget => (
            <div key={widget.id} style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '12px',
              margin: '10px 0',
              fontSize: '13px'
            }}>
              <div><strong>{widget.name}</strong></div>
              <div>💰 ${widget.price} - <span style={{color: '#007bff'}}>{widget.priceCategory}</span></div>
              <div>📅 {widget.daysOld} days old</div>
              <div>📦 Status: <span style={{color: widget.stockStatus === 'available' ? '#28a745' : '#dc3545'}}>{widget.stockStatus}</span></div>
            </div>
          ))}
        </div>

        {/* Server-Side Computed Fields */}
        <div>
          <h2>🏢 Server-Side Computed Fields</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Computed in PostgreSQL functions, exposed via Hasura
          </p>
          <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px' }}>
            <h4>Advantages:</h4>
            <ul style={{ fontSize: '13px', color: '#666' }}>
              <li>Computed once in database</li>
              <li>Can be used in queries, filters & sorts</li>
              <li>Consistent across all clients</li>
              <li>Can access all database functions</li>
            </ul>
            <h4>Disadvantages:</h4>
            <ul style={{ fontSize: '13px', color: '#666' }}>
              <li>Requires server round-trip</li>
              <li>Adds database load</li>
              <li>No access to client state</li>
              <li>Requires migration for changes</li>
            </ul>
          </div>

          {serverData?.widgets.slice(0, 3).map((widget: any) => (
            <div key={widget.id} style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '12px',
              margin: '10px 0',
              fontSize: '13px'
            }}>
              <div><strong>{widget.name}</strong></div>
              <div>💰 ${widget.price} - <span style={{color: '#007bff'}}>{widget.price_category}</span></div>
              <div>📅 {widget.days_old} days old</div>
              <div>📊 Value Score: <span style={{color: '#28a745'}}>{widget.value_score}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div style={{ marginTop: '40px' }}>
        <h2>💻 Code Examples</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>Client-Side (Apollo Field Policies)</h3>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '6px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`// In client-logic.ts
export const typePolicies = {
  widgets: {
    fields: {
      priceCategory: {
        read(_, { readField }) {
          const price = readField('price');
          if (price < 50) return 'budget';
          if (price < 100) return 'mid-range';  
          return 'premium';
        }
      }
    }
  }
};`}</pre>
          </div>

          <div>
            <h3>Server-Side (PostgreSQL Function)</h3>
            <pre style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '6px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`-- In PostgreSQL migration
CREATE FUNCTION get_price_category(
  widget_row widgets
) RETURNS TEXT AS $$
BEGIN
  IF widget_row.price < 50 THEN
    RETURN 'budget';
  ELSIF widget_row.price < 100 THEN
    RETURN 'mid-range';
  ELSE
    RETURN 'premium';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};