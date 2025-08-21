import { useQuery, useMutation, useApolloClient, gql, DocumentNode } from '@apollo/client';

// ===== TYPE DEFINITIONS =====

export interface Category {
  id: number;
  name: string;
  description: string;
  widgets_aggregate: {
    aggregate: {
      count: number;
      avg: { price: number } | null;
      min?: { price: number } | null;
      max?: { price: number } | null;
    };
  };
}

export interface Widget {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  in_stock: boolean;
  created_at: string;
  // Computed fields (client-side)
  priceCategory?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  daysOld?: number;
  stockStatus?: 'available' | 'low-stock' | 'out-of-stock';
}

export interface WidgetsResponse {
  widgets: Widget[];
  widgets_aggregate: {
    aggregate: {
      count: number;
      avg: { price: number } | null;
      min?: { price: number } | null;
      max?: { price: number } | null;
    };
  };
}

export interface CategoriesResponse {
  categories: Category[];
}

// ===== GRAPHQL QUERIES =====

export const GET_WIDGETS = gql`
  query GetWidgets($limit: Int!, $offset: Int!) {
    widgets(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      description
      price
      category {
        id
        name
      }
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

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories(order_by: { name: asc }) {
      id
      name
      description
      widgets_aggregate {
        aggregate {
          count
          avg {
            price
          }
        }
      }
    }
  }
`;

export const GET_ALL_WIDGETS = gql`
  query GetAllWidgets($limit: Int!, $offset: Int!) {
    widgets(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      description
      price
      category {
        id
        name
      }
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

export const GET_FILTERED_WIDGETS = gql`
  query GetFilteredWidgets($categoryId: Int!, $limit: Int!, $offset: Int!) {
    widgets(where: { category_id: { _eq: $categoryId } }, limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      description
      price
      category {
        id
        name
      }
      in_stock
      created_at
    }
    widgets_aggregate(where: { category_id: { _eq: $categoryId } }) {
      aggregate {
        count
        avg {
          price
        }
      }
    }
  }
`;

export const GET_SINGLE_WIDGET = gql`
  query GetSingleWidget($id: Int!) {
    widgets_by_pk(id: $id) {
      id
      name
      description
      price
      category {
        id
        name
      }
      in_stock
      created_at
    }
  }
`;

export const GET_BUDGET_CATEGORIES = gql`
  query GetBudgetCategories($minPrice: numeric!, $maxPrice: numeric!) {
    categories(
      where: {
        widgets: {
          price: { _gte: $minPrice, _lte: $maxPrice }
        }
      }
      order_by: { name: asc }
    ) {
      id
      name
      description
      widgets_aggregate(where: { price: { _gte: $minPrice, _lte: $maxPrice } }) {
        aggregate {
          count
          avg {
            price
          }
          min {
            price
          }
          max {
            price
          }
        }
      }
    }
  }
`;

export const GET_BUDGET_WIDGETS = gql`
  query GetBudgetWidgets($minPrice: numeric!, $maxPrice: numeric!, $categoryId: Int, $limit: Int!, $offset: Int!) {
    widgets(
      where: {
        price: { _gte: $minPrice, _lte: $maxPrice }
        category_id: { _eq: $categoryId }
      }
      limit: $limit
      offset: $offset
      order_by: { price: asc }
    ) {
      id
      name
      description
      price
      category {
        id
        name
      }
      in_stock
      created_at
    }
    widgets_aggregate(
      where: {
        price: { _gte: $minPrice, _lte: $maxPrice }
        category_id: { _eq: $categoryId }
      }
    ) {
      aggregate {
        count
        avg {
          price
        }
        min {
          price
        }
        max {
          price
        }
      }
    }
  }
`;

export const GET_ALL_BUDGET_WIDGETS = gql`
  query GetAllBudgetWidgets($minPrice: numeric!, $maxPrice: numeric!, $limit: Int!, $offset: Int!) {
    widgets(
      where: {
        price: { _gte: $minPrice, _lte: $maxPrice }
      }
      limit: $limit
      offset: $offset
      order_by: { price: asc }
    ) {
      id
      name
      description
      price
      category {
        id
        name
      }
      in_stock
      created_at
    }
    widgets_aggregate(
      where: {
        price: { _gte: $minPrice, _lte: $maxPrice }
      }
    ) {
      aggregate {
        count
        avg {
          price
        }
        min {
          price
        }
        max {
          price
        }
      }
    }
  }
`;

// ===== MUTATIONS =====

export const UPDATE_WIDGET_PRICE = gql`
  mutation UpdateWidgetPrice($id: Int!, $price: numeric!) {
    update_widgets_by_pk(pk_columns: { id: $id }, _set: { price: $price }) {
      id
      name
      price
      description
      category {
        id
        name
      }
      in_stock
      created_at
    }
  }
`;

// ===== CUSTOM HOOKS =====

// Main widgets list hook
export const useWidgetsList = (pageSize: number, currentPage: number) => {
  const offset = (currentPage - 1) * pageSize;
  return useQuery<WidgetsResponse>(GET_WIDGETS, {
    variables: { limit: pageSize, offset },
  });
};

// Categories hook
export const useCategories = () => {
  return useQuery<CategoriesResponse>(GET_CATEGORIES);
};

// Category-filtered widgets hook
export const useCategoryWidgets = (selectedCategoryId: number | null, pageSize: number, currentPage: number) => {
  const offset = (currentPage - 1) * pageSize;
  return useQuery<WidgetsResponse>(
    selectedCategoryId ? GET_FILTERED_WIDGETS : GET_ALL_WIDGETS,
    {
      variables: selectedCategoryId 
        ? { categoryId: selectedCategoryId, limit: pageSize, offset }
        : { limit: pageSize, offset },
    }
  );
};

// Budget categories hook
export const useBudgetCategories = (minPrice: number, maxPrice: number) => {
  return useQuery<CategoriesResponse>(GET_BUDGET_CATEGORIES, {
    variables: { minPrice, maxPrice },
  });
};

// Budget widgets hook
export const useBudgetWidgets = (
  minPrice: number, 
  maxPrice: number, 
  selectedCategoryId: number | null, 
  pageSize: number, 
  currentPage: number
) => {
  const offset = (currentPage - 1) * pageSize;
  return useQuery<WidgetsResponse>(
    selectedCategoryId ? GET_BUDGET_WIDGETS : GET_ALL_BUDGET_WIDGETS,
    {
      variables: selectedCategoryId 
        ? { minPrice, maxPrice, categoryId: selectedCategoryId, limit: pageSize, offset }
        : { minPrice, maxPrice, limit: pageSize, offset },
    }
  );
};

// Single widget hook
export const useSingleWidget = (widgetId: number) => {
  return useQuery(GET_SINGLE_WIDGET, {
    variables: { id: widgetId },
    fetchPolicy: 'cache-first'
  });
};

// ===== OPTIMISTIC MUTATION HOOK =====

interface OptimisticMutationConfig<T = any> {
  mutation: DocumentNode;
  typename: string;
  idField?: string;
  updateFields?: (keyof T)[];
}

export function useOptimisticMutation<T = any>({
  mutation,
  typename,
  idField = 'id',
  updateFields
}: OptimisticMutationConfig<T>) {
  return useMutation(mutation, {
    optimisticResponse: (variables: any) => {
      const mutationName = 'update_widgets_by_pk';
      
      return {
        [mutationName]: {
          __typename: typename,
          [idField]: variables[idField],
          ...variables,
        },
      };
    },
    
    update: (cache, { data }) => {
      const mutationName = Object.keys(data || {})[0];
      const updatedItem = data?.[mutationName];
      
      if (updatedItem) {
        const fragmentFields = updateFields || Object.keys(updatedItem).filter(key => key !== '__typename');
        
        cache.modify({
          fields: {
            [typename.toLowerCase() + 's']: (existing: readonly any[] = [], { readField }) => {
              return existing.map((ref: any) => {
                if (readField && readField(idField, ref) === updatedItem[idField]) {
                  fragmentFields.forEach(field => {
                    if (updatedItem[field] !== undefined) {
                      cache.writeFragment({
                        id: cache.identify(ref),
                        fragment: gql`
                          fragment Updated${typename} on ${typename} {
                            ${field}
                          }
                        `,
                        data: { [field]: updatedItem[field] }
                      });
                    }
                  });
                }
                return ref;
              });
            }
          }
        });

        // Force refetch of aggregate queries by evicting them from cache
        cache.evict({ fieldName: 'widgets_aggregate' });
        cache.gc();
      }
    }
  });
}

// ===== CACHE UTILITIES =====

export const useCacheInvalidation = () => {
  const client = useApolloClient();
  
  const invalidateWidget = async (widgetId: number) => {
    try {
      await client.query({
        query: GET_SINGLE_WIDGET,
        variables: { id: widgetId },
        fetchPolicy: 'network-only'
      });
      
      // Clear cache for aggregate queries that might be affected
      client.cache.evict({ fieldName: 'widgets_aggregate' });
      client.cache.evict({ fieldName: 'categories' });
      client.cache.gc();
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  };

  const refetchAll = () => {
    return client.refetchQueries({ include: 'active' });
  };

  return { invalidateWidget, refetchAll };
};

// ===== WIDGET PRICE UPDATE HOOK =====

export const useWidgetPriceUpdate = () => {
  const [updateWidgetPrice, { loading }] = useOptimisticMutation({
    mutation: UPDATE_WIDGET_PRICE,
    typename: 'widgets',
    updateFields: ['price']
  });

  const updatePrice = async (widgetId: number, newPrice: number, callbacks?: {
    onCompleted?: () => void;
    onError?: (error: any) => void;
  }) => {
    try {
      await updateWidgetPrice({
        variables: { id: widgetId, price: newPrice },
        onCompleted: callbacks?.onCompleted,
        onError: callbacks?.onError
      });
    } catch (error) {
      console.error('Error updating price:', error);
      callbacks?.onError?.(error);
    }
  };

  return { updatePrice, updating: loading };
};

// ===== CLIENT-SIDE COMPUTED FIELDS =====

// Apollo Client field policies for computed fields
export const typePolicies = {
  widgets: {
    fields: {
      // Compute price category based on price
      priceCategory: {
        read(_: any, { readField }: any) {
          const price = readField('price') as number;
          if (price < 50) return 'budget';
          if (price < 100) return 'mid-range';  
          if (price < 200) return 'premium';
          return 'luxury';
        }
      },
      
      // Compute days since creation
      daysOld: {
        read(_: any, { readField }: any) {
          const createdAt = readField('created_at') as string;
          const created = new Date(createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - created.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      },
      
      // Compute stock status with business logic
      stockStatus: {
        read(_: any, { readField }: any) {
          const inStock = readField('in_stock') as boolean;
          const price = readField('price') as number;
          
          if (!inStock) return 'out-of-stock';
          // Simulate low stock for expensive items
          if (price > 150) return 'low-stock';
          return 'available';
        }
      }
    }
  }
};

// Helper functions for manual computation (alternative approach)
export const computeWidgetFields = (widget: Widget): Widget => ({
  ...widget,
  priceCategory: widget.price < 50 ? 'budget' : 
                 widget.price < 100 ? 'mid-range' : 
                 widget.price < 200 ? 'premium' : 'luxury',
  
  daysOld: Math.ceil((Date.now() - new Date(widget.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  
  stockStatus: !widget.in_stock ? 'out-of-stock' :
               widget.price > 150 ? 'low-stock' : 'available'
});

// Hook that returns widgets with computed fields
export const useWidgetsWithComputedFields = (pageSize: number, currentPage: number) => {
  const { loading, error, data, ...rest } = useWidgetsList(pageSize, currentPage);
  
  const enhancedData = data ? {
    ...data,
    widgets: data.widgets.map(computeWidgetFields)
  } : undefined;
  
  return { loading, error, data: enhancedData, ...rest };
};