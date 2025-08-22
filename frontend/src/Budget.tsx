import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Category, Widget, CategoriesResponse, WidgetsResponse, GET_BUDGET_CATEGORIES, GET_BUDGET_WIDGETS, GET_ALL_BUDGET_WIDGETS } from './client-logic';
import { WidgetDetail } from './WidgetDetail';

export const Budget: React.FC = () => {
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(100);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const offset = (currentPage - 1) * pageSize;

  // Get categories that have widgets within budget
  const { loading: categoriesLoading, data: categoriesData } = useQuery<CategoriesResponse>(GET_BUDGET_CATEGORIES, {
    variables: { minPrice: minBudget, maxPrice: maxBudget },
  });

  // Get widgets within budget (with optional category filter)
  const { loading: widgetsLoading, data: widgetsData } = useQuery<WidgetsResponse>(
    selectedCategoryId ? GET_BUDGET_WIDGETS : GET_ALL_BUDGET_WIDGETS,
    {
      variables: selectedCategoryId 
        ? { minPrice: minBudget, maxPrice: maxBudget, categoryId: selectedCategoryId, limit: pageSize, offset }
        : { minPrice: minBudget, maxPrice: maxBudget, limit: pageSize, offset },
    }
  );

  const selectedCategory = selectedCategoryId 
    ? categoriesData?.categories.find((c: Category) => c.id === selectedCategoryId)
    : null;

  const totalCount = widgetsData?.widgets_aggregate.aggregate.count || 0;
  const avgPrice = widgetsData?.widgets_aggregate.aggregate.avg?.price || 0;
  const minPrice = widgetsData?.widgets_aggregate.aggregate.min?.price || 0;
  const maxPrice = widgetsData?.widgets_aggregate.aggregate.max?.price || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = offset + 1;
  const endRecord = Math.min(offset + pageSize, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handleBudgetChange = () => {
    setSelectedCategoryId(null);
    setCurrentPage(1);
  };

  const budgetRange = maxBudget - minBudget;
  const totalBudgetCategories = categoriesData?.categories.length || 0;
  const totalBudgetWidgets = categoriesData?.categories.reduce((sum: number, cat: Category) => sum + cat.widgets_aggregate.aggregate.count, 0) || 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>💰 My Budget Planner</h1>
      
      {/* Budget Controls */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '8px',
        marginBottom: '25px',
        border: '2px solid #e9ecef'
      }}>
        <h2 style={{ marginTop: 0 }}>Set Your Budget Range</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Min Budget: ${minBudget}</label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={minBudget}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMinBudget(val);
                if (val >= maxBudget) setMaxBudget(val + 10);
                handleBudgetChange();
              }}
              style={{ width: '200px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Max Budget: ${maxBudget}</label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={maxBudget}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMaxBudget(val);
                if (val <= minBudget) setMinBudget(val - 10 < 1 ? 1 : val - 10);
                handleBudgetChange();
              }}
              style={{ width: '200px' }}
            />
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              ${budgetRange.toFixed(0)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Budget Range</div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {totalBudgetCategories}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Categories Available</div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {totalBudgetWidgets.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Widgets in Budget</div>
          </div>
        </div>
      </div>

      {/* Categories within Budget */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ marginTop: 0 }}>🎯 Categories You Can Shop In</h3>
        <p style={{ color: '#856404', marginBottom: '15px' }}>
          These categories have widgets within your ${minBudget}-${maxBudget} budget range:
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => handleCategoryFilter(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '2px solid #ffc107',
              backgroundColor: selectedCategoryId === null ? '#ffc107' : 'white',
              color: selectedCategoryId === null ? 'black' : '#856404',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            All Budget Categories ({totalBudgetWidgets})
          </button>
          {categoriesLoading ? (
            <span>Loading categories...</span>
          ) : (
            categoriesData?.categories.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '2px solid #ffc107',
                  backgroundColor: selectedCategoryId === category.id ? '#ffc107' : 'white',
                  color: selectedCategoryId === category.id ? 'black' : '#856404',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {category.name} ({category.widgets_aggregate.aggregate.count})
              </button>
            ))
          )}
        </div>

        {selectedCategory && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <h4>{selectedCategory.name}</h4>
            <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>{selectedCategory.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              <span><strong>Widgets:</strong> {selectedCategory.widgets_aggregate.aggregate.count}</span>
              <span><strong>Avg:</strong> ${selectedCategory.widgets_aggregate.aggregate.avg?.price?.toFixed(2) || '0.00'}</span>
              <span><strong>Min:</strong> ${selectedCategory.widgets_aggregate.aggregate.min?.price?.toFixed(2) || '0.00'}</span>
              <span><strong>Max:</strong> ${selectedCategory.widgets_aggregate.aggregate.max?.price?.toFixed(2) || '0.00'}</span>
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
        backgroundColor: '#d1ecf1',
        borderRadius: '8px',
        border: '1px solid #bee5eb'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>
            💸 {selectedCategory ? `${selectedCategory.name} Widgets` : 'Budget Widgets'} (${minBudget}-${maxBudget})
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
            Showing {startRecord}-{endRecord} of {totalCount.toLocaleString()} widgets
            {avgPrice > 0 && ` • Avg: $${avgPrice.toFixed(2)}`}
            {minPrice > 0 && maxPrice > 0 && ` • Range: $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`}
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
                border: '1px solid #17a2b8',
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
                border: '1px solid #17a2b8',
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
      {widgetsLoading ? (
        <p>Loading budget widgets...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '15px'
        }}>
          {widgetsData?.widgets.map((widget: Widget) => (
            <div
              key={widget.id}
              onClick={() => setSelectedWidget(widget)}
              style={{
                backgroundColor: 'white',
                border: widget.price <= (minBudget + maxBudget) / 2 ? '2px solid #28a745' : '2px solid #17a2b8',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>{widget.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <span style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: widget.price <= (minBudget + maxBudget) / 2 ? '#28a745' : '#17a2b8'
                  }}>
                    ${widget.price}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}>
                    ID: {widget.id}
                  </span>
                </div>
              </div>
              
              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                margin: '0 0 12px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {widget.description}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '15px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {widget.category.name}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: widget.in_stock ? '#e8f5e8' : '#ffebee',
                  color: widget.in_stock ? '#2e7d32' : '#c62828',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {widget.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWidget && (
        <WidgetDetail
          widget={selectedWidget}
          onClose={() => setSelectedWidget(null)}
        />
      )}
    </div>
  );
};