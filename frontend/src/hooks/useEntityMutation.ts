import { useMutation, gql, DocumentNode } from '@apollo/client';

// Even simpler - convention-based
export function useEntityMutation(entityName: string, operation: 'update' | 'create' | 'delete') {
  const typename = entityName;
  const mutationName = `${operation}_${entityName}_by_pk`;
  
  return (mutation: DocumentNode) => 
    useMutation(mutation, {
      optimisticResponse: (variables: any) => ({
        [mutationName]: {
          __typename: typename,
          id: variables.id,
          ...variables,
        },
      }),
      
      update: (cache, { data }) => {
        if (data?.[mutationName]) {
          // Auto-update all lists and fragments
          cache.modify({
            fields: {
              [entityName + 's']: (existing: readonly any[] = [], { readField }) => {
                return existing.map((ref: any) => {
                  if (readField('id', ref) === data[mutationName].id) {
                    Object.keys(data[mutationName]).forEach(field => {
                      if (field !== '__typename' && field !== 'id') {
                        cache.writeFragment({
                          id: cache.identify(ref),
                          fragment: gql`fragment _ on ${typename} { ${field} }`,
                          data: { [field]: data[mutationName][field] }
                        });
                      }
                    });
                  }
                  return ref;
                });
              }
            }
          });
        }
      }
    });
}

// Usage:
// const updateWidget = useEntityMutation('widgets', 'update');
// const [mutate] = updateWidget(UPDATE_WIDGET_PRICE);