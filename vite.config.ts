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
      // Hard-alias React to the top-level install to prevent duplicate instances
      // (common cause of "dispatcher is null" / invalid hook call errors)
      react: path.resolve(__dirname, "node_modules/react/index.js"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom/index.js"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client.js"),
    },
    // Fixes "Invalid hook call" / "dispatcher is null" by ensuring the app and all deps
    // share a single React instance.
    dedupe: [
      "react",
      "react-dom",
      // React subpath entrypoints can otherwise resolve as separate module instances
      // (especially under prebundling / different import graphs).
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          supabase: ['@supabase/supabase-js'],
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
