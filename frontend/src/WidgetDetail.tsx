import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';

const UPDATE_WIDGET_PRICE = gql`
  mutation UpdateWidgetPrice($id: Int!, $price: numeric!) {
    update_widgets_by_pk(pk_columns: { id: $id }, _set: { price: $price }) {
      id
      name
      price
      description
      category
      in_stock
      created_at
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

interface WidgetDetailProps {
  widget: Widget;
  onClose: () => void;
}

export const WidgetDetail: React.FC<WidgetDetailProps> = ({ widget, onClose }) => {
  const [newPrice, setNewPrice] = useState(widget.price.toString());
  const [isEditing, setIsEditing] = useState(false);

  const [updateWidgetPrice, { loading: updating }] = useMutation(UPDATE_WIDGET_PRICE, {
    optimisticResponse: {
      update_widgets_by_pk: {
        __typename: 'widgets',
        id: widget.id,
        name: widget.name,
        price: parseFloat(newPrice),
        description: widget.description,
        category: widget.category,
        in_stock: widget.in_stock,
        created_at: widget.created_at,
      },
    },
    update: (cache, { data }) => {
      if (data?.update_widgets_by_pk) {
        // Update all cached queries that contain this widget
        cache.modify({
          fields: {
            widgets(existingWidgets = [], { readField }) {
              return existingWidgets.map((widgetRef: any) => {
                if (readField('id', widgetRef) === widget.id) {
                  // Update the widget in the list cache
                  cache.writeFragment({
                    id: cache.identify(widgetRef),
                    fragment: gql`
                      fragment UpdatedWidget on widgets {
                        id
                        price
                      }
                    `,
                    data: {
                      id: widget.id,
                      price: data.update_widgets_by_pk.price,
                    },
                  });
                }
                return widgetRef;
              });
            },
          },
        });
      }
    },
    onCompleted: () => {
      setIsEditing(false);
    },
    onError: (error) => {
      alert(`Failed to update price: ${error.message}`);
      setNewPrice(widget.price.toString());
      setIsEditing(false);
    },
  });

  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await updateWidgetPrice({
        variables: {
          id: widget.id,
          price: price,
        },
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handleCancel = () => {
    setNewPrice(widget.price.toString());
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
          <h2 style={{ margin: 0, color: '#333' }}>{widget.name}</h2>
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
            ID: {widget.id} | Category: {widget.category}
          </p>
          <p style={{ color: '#666', lineHeight: '1.6' }}>{widget.description}</p>
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
                  ${widget.price}
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: widget.in_stock ? '#e8f5e8' : '#ffebee',
              color: widget.in_stock ? '#2e7d32' : '#c62828',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {widget.in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Created: {new Date(widget.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};