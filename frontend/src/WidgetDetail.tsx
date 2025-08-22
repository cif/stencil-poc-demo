import React, { useState } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import { Widget, GET_SINGLE_WIDGET, useOptimisticMutation, UPDATE_WIDGET_PRICE, useCacheInvalidation } from './client-logic';

interface WidgetDetailProps {
  widget: Widget;
  onClose: () => void;
}

export const WidgetDetail: React.FC<WidgetDetailProps> = ({ widget, onClose }) => {
  // Get fresh widget data from cache
  const { data: freshWidget } = useQuery(GET_SINGLE_WIDGET, {
    variables: { id: widget.id },
    fetchPolicy: 'cache-first'
  });
  
  const currentWidget = freshWidget?.widgets_by_pk || widget;
  const [newPrice, setNewPrice] = useState(currentWidget.price.toString());
  const [isEditing, setIsEditing] = useState(false);

  const client = useApolloClient();

  const [updateWidgetPrice, { loading: updating }] = useOptimisticMutation({
    mutation: UPDATE_WIDGET_PRICE,
    typename: 'widgets',
    updateFields: ['price']
  });
  const { invalidateWidget } = useCacheInvalidation();

  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await updateWidgetPrice({
        variables: { id: currentWidget.id, price },
        onCompleted: () => setIsEditing(false),
        onError: (error: any) => {
          alert(`Failed to update price: ${error.message}`);
          setNewPrice(currentWidget.price.toString());
          setIsEditing(false);
        }
      });

      // Refresh the specific widget data
      await client.query({
        query: GET_SINGLE_WIDGET,
        variables: { id: currentWidget.id },
        fetchPolicy: 'network-only'
      });
    } catch (error) {
      console.error('Error updating price:', error);
      alert(`Failed to update price: ${error}`);
      setNewPrice(currentWidget.price.toString());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewPrice(currentWidget.price.toString());
    setIsEditing(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{currentWidget.name}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>
            ID: {currentWidget.id} | Category: {currentWidget.category.name}
          </p>
          <p style={{ color: '#666', lineHeight: '1.6' }}>{currentWidget.description}</p>
        </div>

        <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Price:</label>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      width: '120px',
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                  ${currentWidget.price}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSavePrice}
                    disabled={updating}
                    style={{
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating ? 0.7 : 1,
                    }}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={updating}
                    style={{
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating ? 0.7 : 1,
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Price
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={async () => {
              await invalidateWidget(currentWidget.id);
              alert('Cache invalidated and fresh data loaded!');
            }}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              marginTop: '8px',
            }}
          >
            🔄 Invalidate Cache
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: currentWidget.in_stock ? '#e8f5e8' : '#ffebee',
              color: currentWidget.in_stock ? '#2e7d32' : '#c62828',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {currentWidget.in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Created: {new Date(currentWidget.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};