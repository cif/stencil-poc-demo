/**
 * Stencil - GraphQL DOM Bindings Library with Apollo Client
 * Dynamic query builder that reads DOM to construct GraphQL queries
 */

// Set development mode for Apollo DevTools BEFORE any imports
(globalThis as any).__DEV__ = true;

import { ApolloClient, InMemoryCache, gql, DocumentNode } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { SetContextLink } from "@apollo/client/link/context";

// GraphQL endpoint configuration
const GRAPHQL_ENDPOINT = "http://localhost:8081/v1/graphql";
const ADMIN_SECRET = "myadminsecretkey";

// Create Apollo Client IMMEDIATELY (within first 10 seconds) for DevTools detection
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const authLink = new SetContextLink(() => {
  return {
    headers: {
      "X-Hasura-Admin-Secret": ADMIN_SECRET,
    },
  };
});

// Global Apollo Client instance created immediately
const globalApolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  // @ts-expect-error
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

// Expose globally for DevTools
if (typeof window !== "undefined") {
  (window as any).__APOLLO_CLIENT__ = globalApolloClient;
}

interface QueryField {
  element: Element;
  path: string;
}

interface QueryStructure {
  [key: string]: QueryStructure | true;
}

class StencilGraphQL {
  private fields: QueryField[] = [];
  private client: ApolloClient;

  constructor() {
    console.log(
      "🎯 Stencil GraphQL DOM Bindings with Apollo Client + DevTools initialized!",
    );

    // Use the globally created Apollo Client
    this.client = globalApolloClient;

    console.log("🔗 Using global Apollo Client for GraphQL queries");
  }

  /**
   * Scan the DOM for elements with data-gql-field attributes
   */
  scanDOM(): void {
    console.log("🔍 Scanning DOM for GraphQL field bindings...");

    const elements = document.querySelectorAll("[data-gql-field]");
    this.fields = [];

    elements.forEach((element) => {
      const path = element.getAttribute("data-gql-field");
      if (path) {
        this.fields.push({ element, path });
        console.log(`📍 Found field binding: ${path}`);
      }
    });

    console.log(`✅ Found ${this.fields.length} field bindings`);
  }

  /**
   * Build nested query structure from field paths
   */
  buildQueryStructure(): QueryStructure {
    console.log("🏗️  Building query structure from field paths...");

    const structure: QueryStructure = {};

    this.fields.forEach(({ path }) => {
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

    const queryString = `
      query StencilGeneratedQuery {
${queryFields}      }
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

    this.fields.forEach(({ element, path }) => {
      const value = this.getNestedValue(data, path);
      if (value !== undefined) {
        // Format numbers for better display
        const displayValue =
          typeof value === "number"
            ? Number(value).toFixed(2)
            : value.toString();
        element.textContent = displayValue;
        console.log(`✨ Updated ${path}: ${displayValue}`);
      } else {
        console.warn(`⚠️  No value found for path: ${path}`);
        element.textContent = "N/A";
      }
    });
  }

  /**
   * Get nested object value from dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
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
