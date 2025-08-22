import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { watch } from "fs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const app = new Hono();

// Process HTML files with includes
const processIncludes = (html, basePath = "./app") => {
  return html.replace(
    /<!--\s*include\s+["']([^"']+)["']\s*-->/g,
    (match, includePath) => {
      const fullPath = join(basePath, includePath);
      if (existsSync(fullPath)) {
        const includeContent = readFileSync(fullPath, "utf-8");
        return processIncludes(includeContent, basePath); // Recursive includes
      }
      return `<!-- Include not found: ${includePath} -->`;
    },
  );
};

// Serve all files with include processing for HTML
app.use("/*", async (c, next) => {
  const url = new URL(c.req.url);
  let filePath = url.pathname;

  // Handle root path
  if (filePath === "/") {
    filePath = "/index.html";
  }

  // Add .html extension if no extension provided
  if (!filePath.includes(".") && !filePath.endsWith("/")) {
    filePath += ".html";
  }

  const fullPath = join("./app", filePath);

  // Check if HTML file exists
  if (existsSync(fullPath) && filePath.endsWith(".html")) {
    try {
      let html = readFileSync(fullPath, "utf-8");
      html = processIncludes(html);
      return c.html(html);
    } catch (error) {
      console.error("Error processing HTML file:", error);
      return c.notFound();
    }
  }

  // Fall back to static file serving for non-HTML files
  await next();
});

// Serve static assets (CSS, JS, images, etc.)
app.use(
  "/*",
  serveStatic({
    root: "./app",
  }),
);

// WebSocket connections for hot reload
const clients = new Set();

const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    const url = new URL(req.url);
    
    // Handle WebSocket upgrade for hot reload
    if (url.pathname === "/hot-reload") {
      const success = server.upgrade(req);
      if (success) {
        return undefined; // Do not return a Response
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    
    // Handle all other requests with Hono
    return app.fetch(req, server);
  },
  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("Client connected for hot reload");
    },
    close(ws) {
      clients.delete(ws);
      console.log("Client disconnected from hot reload");
    },
    message(ws, message) {
      // Handle incoming WebSocket messages if needed
    },
  },
});

// Watch for file changes and trigger hot reload
const watchPaths = ["./app", "./src"];
watchPaths.forEach((watchPath) => {
  watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`File changed: ${filename}`);
      // Notify all connected clients to reload
      clients.forEach((client) => {
        try {
          client.send("reload");
        } catch (error) {
          console.error("Error sending reload message:", error);
          clients.delete(client);
        }
      });
    }
  });
});

console.log(`Stencil server running at: http://localhost:${server.port}`);
