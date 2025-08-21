import { useMutation, gql, DocumentNode } from '@apollo/client';

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
      // Simple fallback - just use the expected mutation name
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
        cache.evict({ 
          fieldName: 'widgets_aggregate'
        });
        cache.gc(); // Clean up dangling references
      }
    }
  });
}

// Usage:
// const [updateWidget] = useOptimisticMutation({
//   mutation: UPDATE_WIDGET_PRICE,
//   typename: 'widgets',
//   updateFields: ['price', 'name'] 
// });