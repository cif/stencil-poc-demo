import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import { Widget, useWidgetsList } from './client-logic';
import { WidgetDetail } from './WidgetDetail';
import { Categories } from './Categories';
import { Budget } from './Budget';
import { ComputedFieldsDemo } from './ComputedFieldsDemo';

// Navigation component
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav style={{
      backgroundColor: '#343a40',
      padding: '0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        <Link 
          to="/"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '15px 20px',
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          🔧 Widget Store
        </Link>
        <div style={{ display: 'flex' }}>
          <Link
            to="/"
            style={{
              color: location.pathname === '/' ? '#007bff' : 'white',
              textDecoration: 'none',
              padding: '15px 20px',
              borderBottom: location.pathname === '/' ? '3px solid #007bff' : 'none'
            }}
          >
            All Widgets
          </Link>
          <Link
            to="/categories"
            style={{
              color: location.pathname === '/categories' ? '#007bff' : 'white',
              textDecoration: 'none',
              padding: '15px 20px',
              borderBottom: location.pathname === '/categories' ? '3px solid #007bff' : 'none'
            }}
          >
            Categories
          </Link>
          <Link
            to="/budget"
            style={{
              color: location.pathname === '/budget' ? '#007bff' : 'white',
              textDecoration: 'none',
              padding: '15px 20px',
              borderBottom: location.pathname === '/budget' ? '3px solid #007bff' : 'none'
            }}
          >
            💰 My Budget
          </Link>
          <Link
            to="/computed-fields"
            style={{
              color: location.pathname === '/computed-fields' ? '#007bff' : 'white',
              textDecoration: 'none',
              padding: '15px 20px',
              borderBottom: location.pathname === '/computed-fields' ? '3px solid #007bff' : 'none'
            }}
          >
            🧮 Computed Fields
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Widgets List Component
const WidgetsList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const pageSize = 50;
  const offset = (currentPage - 1) * pageSize;

  const { loading, error, data, refetch } = useWidgetsList(pageSize, currentPage);

  if (loading) return <p style={{ padding: '20px' }}>Loading widgets...</p>;
  if (error) return <p style={{ padding: '20px' }}>Error: {error.message}</p>;

  const totalCount = data?.widgets_aggregate.aggregate.count || 0;
  const avgPrice = data?.widgets_aggregate.aggregate.avg?.price || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = offset + 1;
  const endRecord = Math.min(offset + pageSize, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <header style={{ 
        backgroundColor: '#282c34', 
        padding: '20px 0', 
        color: 'white',
        marginBottom: '0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: '0 0 5px 0' }}>All Widgets</h1>
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
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
              ${avgPrice.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Average Price
            </div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
              {totalCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Total Widgets
            </div>
          </div>
        </div>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Description</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Price</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Stock</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', fontWeight: '600' }}>Created</th>
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
                <td style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#666' }}>{widget.id}</td>
                <td style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>{widget.name}</td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  maxWidth: '150px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {widget.description}
                </td>
                <td style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#2e7d32' }}>
                  ${widget.price}
                </td>
                <td style={{ padding: '10px', textAlign: 'left' }}>
                  <span style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontSize: '11px'
                  }}>
                    {widget.category.name}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'left' }}>
                  <span style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    backgroundColor: widget.in_stock ? '#e8f5e8' : '#ffebee',
                    color: widget.in_stock ? '#2e7d32' : '#c62828',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {widget.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#666' }}>
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
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<WidgetsList />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/computed-fields" element={<ComputedFieldsDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
