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
    // Ensure Vite's prebundling doesn't create separate module instances for React internals.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),

      // Hard-pin React entrypoints to a single physical path.
      // This prevents "dispatcher is null" (invalid hook call) caused by multiple React instances.
      react: path.resolve(__dirname, 'node_modules/react/index.js'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
      'react-dom/client': path.resolve(__dirname, 'node_modules/react-dom/client.js'),
    },
    // Fixes "Invalid hook call" / "dispatcher is null" by ensuring the app and all deps
    // share a single React instance.
    dedupe: ["react", "react-dom"],
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
