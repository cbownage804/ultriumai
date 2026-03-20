import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      parserConfig(id) {
        if (id.endsWith('.tsx')) return { syntax: 'typescript', tsx: true };
        if (id.endsWith('.ts') || id.endsWith('.mts')) return { syntax: 'typescript', tsx: false };
        if (id.endsWith('.jsx') || id.endsWith('.mdx')) return { syntax: 'ecmascript', jsx: true };
      },
    }),
  ].filter(Boolean),
  optimizeDeps: {
    // Prebundle React entrypoints so Vite can provide correct ESM named exports (e.g. Fragment)
    // while our `resolve.dedupe` below ensures there is still only ONE React instance.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
    // Force re-optimization so stale prebundles can't keep reintroducing multiple instances.
    force: true,
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Fixes "Invalid hook call" / "dispatcher is null" by ensuring the app and all deps
    // share a single React instance.
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@elevenlabs/react",
    ],
  },
  build: {
    minify: false,
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
  },
  // Enable gzip compression
  preview: {
    port: 8080,
    host: "::",
  },
}));
