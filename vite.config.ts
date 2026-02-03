import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    mode === 'development' &&
    componentTagger(),
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force all React imports to use the same instance from node_modules
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
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
    // Optimize bundle size - but avoid chunking React separately to prevent multiple instances
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React together in one chunk to avoid multiple instances
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Other large dependencies
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          return undefined;
        },
      },
    },
    // Enable minification (using default esbuild minifier)
    minify: mode === 'production',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Enable gzip compression
  preview: {
    port: 8080,
    host: "::",
  },
}));
