import React, { useState } from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import { WidgetDetail } from './WidgetDetail';

const GET_WIDGETS = gql`
  query GetWidgets($limit: Int!, $offset: Int!) {
    widgets(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      description
      price
      category
      in_stock
      created_at
    }
    widgets_aggregate {
      aggregate {
        count
        avg {
          price
        }
      }
    }
  }
`;

interface Widget {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  in_stock: boolean;
  created_at: string;
}

interface WidgetsResponse {
  widgets: Widget[];
  widgets_aggregate: {
    aggregate: {
      count: number;
      avg: {
        price: number;
      };
    };
  };
}

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const pageSize = 50;
  const offset = (currentPage - 1) * pageSize;

  const { loading, error, data, refetch } = useQuery<WidgetsResponse>(GET_WIDGETS, {
    variables: { limit: pageSize, offset },
  });

  if (loading) return <p>Loading widgets...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const totalCount = data?.widgets_aggregate.aggregate.count || 0;
  const avgPrice = data?.widgets_aggregate.aggregate.avg?.price || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = offset + 1;
  const endRecord = Math.min(offset + pageSize, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>Widget Store</h1>
          <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
            Showing {startRecord}-{endRecord} of {totalCount.toLocaleString()} widgets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => refetch()}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Refresh Data
          </button>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button 
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ 
                padding: '8px 12px', 
                fontSize: '14px',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '14px', padding: '0 10px' }}>
              Page {currentPage} of {totalPages.toLocaleString()}
            </span>
            <button 
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ 
                padding: '8px 12px', 
                fontSize: '14px',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </header>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderBottom: '1px solid #e9ecef',
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
            📊 Widget Analytics
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '40px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '16px 24px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                ${avgPrice.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Average Price
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '16px 24px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {totalCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Total Widgets
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Price</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.widgets.map((widget, index) => (
              <tr 
                key={widget.id}
                onClick={() => setSelectedWidget(widget)}
                style={{ 
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9f9f9';
                }}
              >
                <td style={{ padding: '12px' }}>{widget.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{widget.name}</td>
                <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {widget.description}
                </td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2e7d32' }}>
                  ${widget.price}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontSize: '12px'
                  }}>
                    {widget.category}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: widget.in_stock ? '#e8f5e8' : '#ffebee',
                    color: widget.in_stock ? '#2e7d32' : '#c62828',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {widget.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                  {new Date(widget.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      
      {selectedWidget && (
        <WidgetDetail
          widget={selectedWidget}
          onClose={() => setSelectedWidget(null)}
        />
      )}
    </div>
  );
}

export default App;
