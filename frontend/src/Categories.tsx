import React, { useState } from 'react';
import { Category, Widget, useCategories, useCategoryWidgets } from './client-logic';
import { WidgetDetail } from './WidgetDetail';

export const Categories: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const offset = (currentPage - 1) * pageSize;

  const { loading: categoriesLoading, error: categoriesError, data: categoriesData } = useCategories();
  const { loading: widgetsLoading, error: widgetsError, data: widgetsData } = useCategoryWidgets(selectedCategoryId, pageSize, currentPage);

  if (categoriesLoading || widgetsLoading) return <p>Loading...</p>;
  if (categoriesError) return <p>Error loading categories: {categoriesError.message}</p>;
  if (widgetsError) return <p>Error loading widgets: {widgetsError.message}</p>;

  const selectedCategory = selectedCategoryId 
    ? categoriesData?.categories.find((c: Category) => c.id === selectedCategoryId)
    : null;
    
  const totalCount = widgetsData?.widgets_aggregate.aggregate.count || 0;
  const avgPrice = widgetsData?.widgets_aggregate.aggregate.avg?.price || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = offset + 1;
  const endRecord = Math.min(offset + pageSize, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Categories & Widgets</h1>
      
      {/* Category Filter Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Filter by Category</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => handleCategoryFilter(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #ddd',
              backgroundColor: selectedCategoryId === null ? '#007bff' : 'white',
              color: selectedCategoryId === null ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            All Categories ({categoriesData?.categories.reduce((sum: number, cat: Category) => sum + cat.widgets_aggregate.aggregate.count, 0) || 0})
          </button>
          {categoriesData?.categories.map((category: Category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryFilter(category.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #ddd',
                backgroundColor: selectedCategoryId === category.id ? '#007bff' : 'white',
                color: selectedCategoryId === category.id ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {category.name} ({category.widgets_aggregate.aggregate.count})
            </button>
          ))}
        </div>
        
        {selectedCategory && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3>{selectedCategory.name}</h3>
            <p style={{ color: '#666', marginBottom: '10px' }}>{selectedCategory.description}</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span><strong>Widgets:</strong> {selectedCategory.widgets_aggregate.aggregate.count}</span>
              <span><strong>Avg Price:</strong> ${selectedCategory.widgets_aggregate.aggregate.avg?.price?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '8px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>
            {selectedCategory ? `${selectedCategory.name} Widgets` : 'All Widgets'}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Showing {startRecord}-{endRecord} of {totalCount.toLocaleString()} widgets
            {avgPrice > 0 && ` • Average Price: $${avgPrice.toFixed(2)}`}
          </p>
        </div>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button 
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ 
                padding: '6px 12px', 
                fontSize: '14px',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '14px', padding: '0 10px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ 
                padding: '6px 12px', 
                fontSize: '14px',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Widgets Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {widgetsData?.widgets.map((widget: Widget) => (
          <div
            key={widget.id}
            onClick={() => setSelectedWidget(widget)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#333' }}>{widget.name}</h4>
              <span style={{ 
                fontSize: '12px', 
                color: '#666',
                backgroundColor: '#f0f0f0',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                ID: {widget.id}
              </span>
            </div>
            
            <p style={{ 
              color: '#666', 
              fontSize: '14px', 
              margin: '0 0 10px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {widget.description}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#2e7d32' 
              }}>
                ${widget.price}
              </span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {widget.category.name}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: widget.in_stock ? '#e8f5e8' : '#ffebee',
                color: widget.in_stock ? '#2e7d32' : '#c62828',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {widget.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
              <span style={{ fontSize: '11px', color: '#999' }}>
                {new Date(widget.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedWidget && (
        <WidgetDetail
          widget={selectedWidget}
          onClose={() => setSelectedWidget(null)}
        />
      )}
    </div>
  );
};