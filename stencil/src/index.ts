/**
 * Stencil - GraphQL DOM Bindings Library with Apollo Client
 * Dynamic query builder that reads DOM to construct GraphQL queries
 */

(globalThis as any).__DEV__ = true;

import { ApolloClient, InMemoryCache, gql, DocumentNode } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { setContext } from "@apollo/client/link/context";

// GraphQL endpoint configuration
const GRAPHQL_ENDPOINT = "http://localhost:8081/v1/graphql";
const ADMIN_SECRET = "myadminsecretkey";

// Create Apollo Client IMMEDIATELY (within first 10 seconds) for DevTools detection
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "X-Hasura-Admin-Secret": ADMIN_SECRET,
    },
  };
});

interface QueryField {
  element: Element;
  path: string;
}

interface LoopContainer {
  element: Element;
  arrayName: string;
  limit: number;
  template: Element;
}

interface QueryStructure {
  [key: string]: QueryStructure | true;
}

class StencilGraphQL {
  private fields: QueryField[] = [];
  private loops: LoopContainer[] = [];
  private client: ApolloClient;
  private currentOffset: number = 0;

  constructor() {
    console.log(
      "🎯 Stencil GraphQL DOM Bindings with Apollo Client + DevTools initialized!",
    );

    // Use the globally created Apollo Client
    this.client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      connectToDevTools: true,
      // name: "stencil-apollo-client",
      // version: "1.0.0",
      defaultOptions: {
        watchQuery: {
          errorPolicy: "all",
        },
        query: {
          errorPolicy: "all",
        },
      },
    });
    console.log("🔗 Using global Apollo Client for GraphQL queries");

    (window as any).__APOLLO_CLIENT__ = this.client;
  }

  /**
   * Scan the DOM for elements with data-gql-field attributes
   */
  scanDOM(): void {
    console.log("🔍 Scanning DOM for GraphQL field bindings...");

    // Scan for loop containers first
    this.scanLoopContainers();
    
    // Scan for regular field bindings (outside of templates)
    const elements = document.querySelectorAll("[data-gql-field]:not([data-gql-template] [data-gql-field])");
    this.fields = [];

    elements.forEach((element) => {
      const path = element.getAttribute("data-gql-field");
      if (path) {
        this.fields.push({ element, path });
        console.log(`📍 Found field binding: ${path}`);
      }
    });

    console.log(`✅ Found ${this.fields.length} field bindings and ${this.loops.length} loop containers`);
    
    // Set up refresh button listeners
    this.setupRefreshButtons();
    
    // Set up pagination button listeners
    this.setupPaginationButtons();
  }

  /**
   * Scan for loop containers and templates
   */
  scanLoopContainers(): void {
    const loopElements = document.querySelectorAll("[data-gql-loop]");
    this.loops = [];

    loopElements.forEach((loopElement) => {
      const arrayName = loopElement.getAttribute("data-gql-loop");
      const limitStr = loopElement.getAttribute("data-gql-limit");
      const template = loopElement.querySelector("[data-gql-template]");
      
      if (arrayName && template && limitStr) {
        const limit = parseInt(limitStr) || 5;
        this.loops.push({ 
          element: loopElement, 
          arrayName, 
          limit,
          template: template as Element 
        });
        console.log(`🔄 Found loop container: ${arrayName} (limit: ${limit})`);
      }
    });
  }

  /**
   * Get fields needed for a loop template by scanning its data-gql-field attributes
   */
  getTemplateFields(template: Element): string[] {
    const fieldElements = template.querySelectorAll('[data-gql-field]');
    const fields = new Set<string>();
    
    fieldElements.forEach(fieldElement => {
      const fieldPath = fieldElement.getAttribute('data-gql-field');
      if (fieldPath) {
        fields.add(fieldPath);
      }
    });
    
    return Array.from(fields);
  }

  /**
   * Set up event listeners for refresh buttons
   */
  setupRefreshButtons(): void {
    const refreshButtons = document.querySelectorAll("[data-gql-refresh]");
    
    refreshButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        console.log("🔄 Refresh button clicked - invalidating cache and refetching data...");
        
        // Clear Apollo cache
        this.clearCache();
        
        // Re-run the query process with fresh data
        const query = this.buildQuery();
        if (query) {
          const result = await this.executeQuery(query, false); // Force network request
          if (result) {
            this.updateDOM(result);
          }
        }
        
        console.log("✅ Data refreshed successfully!");
      });
    });
    
    console.log(`🔄 Set up ${refreshButtons.length} refresh button listeners`);
  }

  /**
   * Set up event listeners for pagination buttons
   */
  setupPaginationButtons(): void {
    const paginationButtons = document.querySelectorAll("[data-gql-paginate]");
    
    paginationButtons.forEach((button) => {
      const direction = button.getAttribute("data-gql-paginate");
      
      button.addEventListener("click", async () => {
        console.log(`📄 Pagination button clicked: ${direction}`);
        
        // Get page size from the first loop container (assumes one paginated list per page)
        const pageSize = this.loops.length > 0 ? this.loops[0].limit : 5;
        
        if (direction === "next") {
          this.currentOffset += pageSize;
        } else if (direction === "prev" && this.currentOffset >= pageSize) {
          this.currentOffset -= pageSize;
        }
        
        // Prevent negative offsets
        if (this.currentOffset < 0) {
          this.currentOffset = 0;
        }
        
        console.log(`📄 Current offset: ${this.currentOffset}, page size: ${pageSize}`);
        
        // Re-run the query with new pagination
        const query = this.buildQuery();
        if (query) {
          const result = await this.executeQuery(query, false); // Force fresh data
          if (result) {
            this.updateDOM(result);
          }
        }
      });
    });
    
    console.log(`📄 Set up ${paginationButtons.length} pagination button listeners`);
  }

  /**
   * Build nested query structure from field paths
   */
  buildQueryStructure(): QueryStructure {
    console.log("🏗️  Building query structure from field paths...");

    const structure: QueryStructure = {};

    this.fields.forEach(({ path }) => {
      // Skip widget array paths - we handle these separately
      if (path.startsWith('widgets.') && /widgets\.\d+\./.test(path)) {
        return;
      }
      
      // Skip special computed fields
      if (path === 'current_page') {
        return;
      }

      const parts = path.split(".");
      let current = structure;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node
          current[part] = true;
        } else {
          // Nested object
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as QueryStructure;
        }
      });
    });

    console.log("📊 Query structure built:", structure);
    return structure;
  }

  /**
   * Convert query structure to GraphQL string
   */
  structureToGraphQL(structure: QueryStructure, depth = 0): string {
    const indent = "  ".repeat(depth);
    let result = "";

    Object.entries(structure).forEach(([key, value]) => {
      if (value === true) {
        result += `${indent}${key}\n`;
      } else {
        result += `${indent}${key} {\n`;
        result += this.structureToGraphQL(value as QueryStructure, depth + 1);
        result += `${indent}}\n`;
      }
    });

    return result;
  }

  /**
   * Build complete GraphQL query from discovered field paths
   */
  buildQuery(): DocumentNode | null {
    console.log("🏗️  Building GraphQL query from field paths...");

    if (this.fields.length === 0) {
      console.log("⚠️  No fields found to query");
      return null;
    }

    const structure = this.buildQueryStructure();
    const queryFields = this.structureToGraphQL(structure, 1);

    // Build queries for loop containers dynamically by scanning their templates
    let loopQueries = '';
    this.loops.forEach(loop => {
      const templateFields = this.getTemplateFields(loop.template);
      
      // Build field list dynamically from template
      let fieldList = '';
      templateFields.forEach(field => {
        if (field === 'category') {
          // Handle nested category relationship
          fieldList += '      category {\n        name\n      }\n';
        } else {
          fieldList += `      ${field}\n`;
        }
      });
      
      loopQueries += `    ${loop.arrayName}(limit: ${loop.limit}, offset: ${this.currentOffset}, order_by: {id: asc}) {
${fieldList}    }
`;
      
      console.log(`🔄 Generated query for ${loop.arrayName} with fields:`, templateFields);
    });

    const queryString = `
      query StencilGeneratedQuery {
${loopQueries}${queryFields}      }
    `;

    console.log("📝 Generated GraphQL query:", queryString);

    try {
      return gql(queryString);
    } catch (error) {
      console.error("❌ Invalid GraphQL query generated:", error);
      return null;
    }
  }

  /**
   * Execute GraphQL query using Apollo Client
   */
  async executeQuery(
    query: DocumentNode,
    useCache: boolean = true,
  ): Promise<any> {
    console.log("🚀 Executing GraphQL query with Apollo Client...");

    try {
      const result = await this.client.query({
        query,
        fetchPolicy: useCache ? "cache-first" : "network-only",
        errorPolicy: "all",
        // Add query metadata for DevTools
        context: {
          queryName: "StencilGeneratedQuery",
          source: "stencil-dom-bindings",
        },
      });

      console.log("📊 Query result:", result.data);

      return result.data;
    } catch (error) {
      console.error("❌ Query execution failed:", error);
      return null;
    }
  }

  /**
   * Update DOM elements with query results
   */
  updateDOM(data: any): void {
    console.log("🎨 Updating DOM with query results...");

    // Update regular field bindings
    this.fields.forEach(({ element, path }) => {
      let value;
      
      // Handle special cases for pagination
      if (path === "current_page") {
        const pageSize = this.loops.length > 0 ? this.loops[0].limit : 5;
        value = Math.floor(this.currentOffset / pageSize) + 1;
      } else {
        value = this.getNestedValue(data, path);
      }
      
      if (value !== undefined && value !== null) {
        // Format different types for display
        let displayValue;
        if (typeof value === "number") {
          displayValue = Number(value).toFixed(2);
        } else if (typeof value === "boolean") {
          displayValue = value ? "Yes" : "No";
        } else {
          displayValue = value.toString();
        }
        
        element.textContent = displayValue;
        console.log(`✨ Updated ${path}: ${displayValue}`);
      } else {
        console.warn(`⚠️  No value found for path: ${path}`);
        element.textContent = "N/A";
      }
    });

    // Update loop containers
    this.updateLoopContainers(data);
  }

  /**
   * Update loop containers by replicating templates
   */
  updateLoopContainers(data: any): void {
    console.log('🎨 Updating loop containers with data:', data);
    
    this.loops.forEach(loop => {
      const arrayData = data[loop.arrayName];
      console.log(`🔄 Processing loop ${loop.arrayName}:`, arrayData);
      
      if (!Array.isArray(arrayData)) {
        console.warn(`⚠️  No array data found for loop: ${loop.arrayName}`, data);
        return;
      }

      if (arrayData.length === 0) {
        console.warn(`⚠️  Empty array for loop: ${loop.arrayName}`);
      }

      // Clear existing replicated items (keep template)
      const existingItems = loop.element.querySelectorAll('[data-gql-replicated]');
      console.log(`🧹 Clearing ${existingItems.length} existing replicated items`);
      existingItems.forEach(item => item.remove());

      // Show the template temporarily for cloning
      (loop.template as HTMLElement).style.display = '';

      // Replicate template for each data item
      arrayData.forEach((item, index) => {
        console.log(`📋 Creating replica ${index} with data:`, item);
        
        const replica = loop.template.cloneNode(true) as Element;
        
        // Mark as replicated and remove template attribute
        replica.setAttribute('data-gql-replicated', 'true');
        replica.removeAttribute('data-gql-template');
        
        // Update field bindings within this replica
        const fieldElements = replica.querySelectorAll('[data-gql-field]');
        fieldElements.forEach(fieldElement => {
          const fieldPath = fieldElement.getAttribute('data-gql-field');
          if (fieldPath) {
            let value = item[fieldPath];
            
            // Handle special case for category (nested object)
            if (fieldPath === 'category' && item.category) {
              value = item.category.name;
            }
            
            if (value !== undefined && value !== null) {
              let displayValue;
              if (typeof value === "number") {
                displayValue = Number(value).toFixed(2);
              } else if (typeof value === "boolean") {
                displayValue = value ? "Yes" : "No";
              } else {
                displayValue = value.toString();
              }
              
              fieldElement.textContent = displayValue;
              console.log(`  ✨ Updated ${fieldPath}: ${displayValue}`);
            } else {
              fieldElement.textContent = "N/A";
              console.log(`  ⚠️  No value for ${fieldPath}`);
            }
          }
        });

        // Insert before the template
        loop.element.insertBefore(replica, loop.template);
      });

      // Hide the original template again
      (loop.template as HTMLElement).style.display = 'none';
      
      console.log(`🔄 Updated loop container ${loop.arrayName} with ${arrayData.length} items`);
    });
  }

  /**
   * Get nested object value from dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    // Handle widget array access (widgets.0.name -> widgets[0].name)
    if (path.startsWith('widgets.') && /widgets\.\d+\./.test(path)) {
      const match = path.match(/^widgets\.(\d+)\.(.+)$/);
      if (match && obj.widgets && Array.isArray(obj.widgets)) {
        const index = parseInt(match[1]);
        const field = match[2];
        
        // Special handling for category field (it's a nested object)
        if (field === 'category') {
          return obj.widgets[index]?.category?.name;
        }
        
        return obj.widgets[index]?.[field];
      }
      return undefined;
    }
    
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log("🎬 Starting Stencil GraphQL DOM binding process...");

    this.scanDOM();
    const query = this.buildQuery();

    if (query) {
      const result = await this.executeQuery(query, true); // Use Apollo cache
      if (result) {
        this.updateDOM(result);
      }
    }

    console.log("🎉 Stencil GraphQL process complete!");
  }

  /**
   * Refresh data and update DOM (forces fresh data, bypasses cache)
   */
  async refresh(): Promise<void> {
    console.log("🔄 Refreshing GraphQL data...");
    const query = this.buildQuery();

    if (query) {
      const result = await this.executeQuery(query, false); // Force network
      if (result) {
        this.updateDOM(result);
      }
    }
  }

  /**
   * Clear Apollo cache
   */
  clearCache(): void {
    console.log("🗑️  Clearing Apollo cache...");
    this.client.cache.reset();
  }

  /**
   * Get Apollo cache statistics
   */
  getCacheStats(): any {
    const cacheData = this.client.cache.extract();
    return {
      cacheSize: cacheData ? Object.keys(cacheData).length : 0,
      cache: cacheData,
    };
  }

  /**
   * Get Apollo Client instance for advanced usage
   */
  getApolloClient() {
    return this.client;
  }
}

// Initialize and run when DOM is ready
const stencil = new StencilGraphQL();

// Expose stencil globally for testing
(window as any).stencil = stencil;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM is ready, initializing Stencil...");
    stencil.run();
  });
} else {
  console.log("🚀 DOM already ready, initializing Stencil...");
  stencil.run();
}
